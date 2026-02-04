import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import multer from "multer";
import cron from "node-cron";
import { createAuditLog } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const prisma = new PrismaClient();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_permit_updates", (permitId) => {
    socket.join(`permit_${permitId}`);
    console.log(`User ${socket.id} joined room for permit: ${permitId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ✅ Auto-Reminders: Check for expiring permits every minute
cron.schedule("* * * * *", async () => {
  try {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const expiringSoon = await prisma.permit.findMany({
      where: {
        status: "active",
        validUntil: {
          lte: twoHoursFromNow,
          gt: new Date()
        }
      }
    });

    if (expiringSoon.length > 0) {
      console.log(`[Reminder] Found ${expiringSoon.length} permits expiring soon.`);
      expiringSoon.forEach(permit => {
        io.emit("permit_expiring_soon", {
          id: permit.id,
          permitNumber: permit.permitNumber,
          validUntil: permit.validUntil
        });
      });
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "PTW Tracker API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * ✅ DEV: hızlı test için user seed endpoint (sonra silersin)
 */
app.post("/api/v1/dev/seed-user", async (req: Request, res: Response) => {
  try {
    const email = req.body?.email || "admin@ptw.local";
    const fullName = req.body?.fullName || "Admin User";
    const role = req.body?.role || "admin";

    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName, role },
      create: {
        email,
        fullName,
        role,
        passwordHash: "dummy-hash",
      },
    });

    return res.json({ success: true, data: user });
  } catch (err: any) {
    console.error("seed-user error:", err);
    return res.status(500).json({ success: false, error: "Failed to seed user" });
  }
});

// ==================== DOCUMENTS API ====================

// ✅ Upload Document
app.post("/api/v1/documents/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { permitId, type } = req.body;
    if (!permitId) {
      return res.status(400).json({ success: false, error: "permitId is required" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const document = await prisma.document.create({
      data: {
        name: req.file.originalname,
        url: fileUrl,
        type: type || "other",
        permitId: permitId,
      },
    });

    // Notify clients in the permit room
    io.to(`permit_${permitId}`).emit("document_uploaded", { permitId, document });

    // Audit Log
    await createAuditLog({
      action: "UPLOAD_DOCUMENT",
      entityType: "Document",
      entityId: document.id,
      permitId: permitId,
      details: { name: document.name, type: document.type },
      ipAddress: req.ip
    });

    return res.json({ success: true, data: document });
  } catch (err: any) {
    console.error("POST /api/v1/documents/upload error:", err);
    return res.status(500).json({ success: false, error: "Failed to upload document" });
  }
});

// ==================== SIGNATURES API ====================

// ✅ Save Signature
app.post("/api/v1/signatures", async (req: Request, res: Response) => {
  try {
    const { permitId, role, signerName, signatureUrl } = req.body;

    if (!permitId || !role || !signerName || !signatureUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const signature = await prisma.signature.create({
      data: {
        permitId,
        role,
        signerName,
        signatureUrl,
      },
    });

    // Notify clients in the permit room
    io.to(`permit_${permitId}`).emit("signature_added", { permitId, signature });

    // Audit Log
    await createAuditLog({
      action: "ADD_SIGNATURE",
      entityType: "Signature",
      entityId: signature.id,
      permitId: permitId,
      details: { role, signerName },
      ipAddress: req.ip
    });

    return res.json({ success: true, data: signature });
  } catch (err: any) {
    console.error("POST /api/v1/signatures error:", err);
    return res.status(500).json({ success: false, error: "Failed to save signature" });
  }
});

// ==================== PERMITS API ====================

// ✅ Permits: LIST with filters
app.get("/api/v1/permits", async (req: Request, res: Response) => {
  try {
    const { status, ptwType, riskLevel, search } = req.query;

    const where: any = {};

    if (status && status !== 'all') where.status = status;
    if (ptwType && ptwType !== 'all') where.ptwType = ptwType;
    if (riskLevel && riskLevel !== 'all') where.riskLevel = riskLevel;

    if (search) {
      where.OR = [
        { permitNumber: { contains: search as string } },
        { description: { contains: search as string } },
        { locationName: { contains: search as string } },
        { contractorName: { contains: search as string } },
      ];
    }

    const permits = await prisma.permit.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        documents: true,
        signatures: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: permits });
  } catch (err: any) {
    console.error("GET /api/v1/permits error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch permits" });
  }
});

// ✅ Permits: GET by ID
app.get("/api/v1/permits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        documents: true,
        signatures: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!permit) {
      return res.status(404).json({ success: false, error: "Permit not found" });
    }

    return res.json({ success: true, data: permit });
  } catch (err: any) {
    console.error("GET /api/v1/permits/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch permit" });
  }
});

// ✅ Permits: CREATE
app.post("/api/v1/permits", async (req: Request, res: Response) => {
  try {
    const {
      ptwType,
      riskLevel,
      locationName,
      contractorName,
      description,
      validFrom,
      validUntil,
      createdById,
      status = "draft",
    } = req.body;

    if (
      !ptwType ||
      !riskLevel ||
      !locationName ||
      !contractorName ||
      !description ||
      !validFrom ||
      !validUntil ||
      !createdById
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: req.body
      });
    }

    const userExists = await prisma.user.findUnique({ where: { id: createdById } });
    if (!userExists) {
      return res.status(400).json({
        success: false,
        error: `createdById not found: ${createdById}`,
      });
    }

    const year = new Date().getFullYear();

    const created = await prisma.$transaction(async (tx) => {
      const counter = await tx.permitCounter.upsert({
        where: { year },
        update: { lastNo: { increment: 1 } },
        create: { year, lastNo: 1 },
      });

      const seq = counter.lastNo.toString().padStart(5, "0");
      const permitNumber = `PTW-${year}-${seq}`;

      // Logic for Crane Permits
      let initialStatus = status;
      if (ptwType === "Mobile Crane") {
        initialStatus = "engineering_review";
        const diffInDays = (new Date(validFrom).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        if (diffInDays < 3) {
          // We can block or just warn. Let's log it for now, or maybe the frontend already warned.
          console.log(`[Warning] Mobile Crane permit created with less than 3 days notice: ${permitNumber}`);
        }
      }

      return tx.permit.create({
        data: {
          permitNumber,
          ptwType,
          ptwSubType: req.body.ptwSubType,
          riskLevel,
          status: initialStatus,
          locationName,
          contractorName,
          description,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          createdById,
          qrCodeUrl: null,
          qrCodeData: null,
          // Safiport Form Fields
          workEntity: req.body.workEntity,
          temperature: req.body.temperature,
          humidity: req.body.humidity,
          personnelList: req.body.personnelList,
          workTypes: req.body.workTypes,
          selectedHazards: req.body.selectedHazards,
          selectedPrecautions: req.body.selectedPrecautions,
          selectedPPE: req.body.selectedPPE,
          otherHazards: req.body.otherHazards,
          otherPrecautions: req.body.otherPrecautions,
          otherPPE: req.body.otherPPE,
          siteTestRequired: req.body.siteTestRequired,
          requiredCertificates: req.body.requiredCertificates,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            }
          }
        }
      });
    });

    // Create Audit Log
    await createAuditLog({
      userId: createdById,
      action: "CREATE_PERMIT",
      entityType: "Permit",
      entityId: created.id,
      permitId: created.id,
      details: { permitNumber: created.permitNumber },
      ipAddress: req.ip
    });

    // Notify via Socket.io
    io.emit("new_permit", created);

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error("POST /api/v1/permits error:", err);
    return res.status(500).json({ success: false, error: "Failed to create permit" });
  }
});

// ✅ Permits: UPDATE
app.put("/api/v1/permits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      ptwType,
      riskLevel,
      locationName,
      contractorName,
      description,
      validFrom,
      validUntil,
      status,
    } = req.body;

    // Strict Validation for moving to 'pending' (Review)
    // If status is changing to 'pending' from 'draft', check prerequisites
    if (status === 'pending') {
      const existingPermit = await prisma.permit.findUnique({ where: { id } });
      // Check if fields are present in DB or in current payload
      const isHazards = req.body.hazardsIdentified ?? existingPermit?.hazardsIdentified;
      const isControls = req.body.controlsRequired ?? existingPermit?.controlsRequired;
      const isPPE = req.body.ppeIdentified ?? existingPermit?.ppeIdentified;
      const isEquipment = req.body.equipmentIdentified ?? existingPermit?.equipmentIdentified;

      if (!isHazards || !isControls || !isPPE || !isEquipment) {
        return res.status(400).json({
          success: false,
          error: "Cannot submit for review. Hazards, Controls, PPE, and Equipment must be identified.",
          missing: { hazards: !isHazards, controls: !isControls, ppe: !isPPE, equipment: !isEquipment }
        });
      }
    }

    const updated = await prisma.permit.update({
      where: { id },
      data: {
        ...(ptwType && { ptwType }),
        ...(req.body.ptwSubType !== undefined && { ptwSubType: req.body.ptwSubType }),
        ...(riskLevel && { riskLevel }),
        ...(locationName && { locationName }),
        ...(contractorName && { contractorName }),
        ...(description && { description }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(status && { status }),
        // Workflow fields
        ...(req.body.hazardsIdentified !== undefined && { hazardsIdentified: req.body.hazardsIdentified }),
        ...(req.body.controlsRequired !== undefined && { controlsRequired: req.body.controlsRequired }),
        ...(req.body.ppeIdentified !== undefined && { ppeIdentified: req.body.ppeIdentified }),
        ...(req.body.equipmentIdentified !== undefined && { equipmentIdentified: req.body.equipmentIdentified }),
        ...(req.body.affectedDeptApproved !== undefined && {
          affectedDeptApproved: req.body.affectedDeptApproved,
          affectedDeptApprovedAt: req.body.affectedDeptApproved ? new Date() : null,
          affectedDeptApprovedBy: req.body.affectedDeptApproved ? req.body.userId : null
        }),
        // Safiport Form Fields
        ...(req.body.workEntity !== undefined && { workEntity: req.body.workEntity }),
        ...(req.body.temperature !== undefined && { temperature: req.body.temperature }),
        ...(req.body.humidity !== undefined && { humidity: req.body.humidity }),
        ...(req.body.personnelList !== undefined && { personnelList: req.body.personnelList }),
        ...(req.body.workTypes !== undefined && { workTypes: req.body.workTypes }),
        ...(req.body.selectedHazards !== undefined && { selectedHazards: req.body.selectedHazards }),
        ...(req.body.selectedPrecautions !== undefined && { selectedPrecautions: req.body.selectedPrecautions }),
        ...(req.body.selectedPPE !== undefined && { selectedPPE: req.body.selectedPPE }),

        // Custom Others
        ...(req.body.otherHazards !== undefined && { otherHazards: req.body.otherHazards }),
        ...(req.body.otherPrecautions !== undefined && { otherPrecautions: req.body.otherPrecautions }),
        ...(req.body.otherPPE !== undefined && { otherPPE: req.body.otherPPE }),
        ...(req.body.siteTestRequired !== undefined && { siteTestRequired: req.body.siteTestRequired }),
        ...(req.body.requiredCertificates !== undefined && { requiredCertificates: req.body.requiredCertificates }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
    });

    // Create Audit Log
    await createAuditLog({
      userId: updated.createdById,
      action: "UPDATE_PERMIT",
      entityType: "Permit",
      entityId: updated.id,
      permitId: updated.id,
      details: { status: updated.status },
      ipAddress: req.ip
    });

    // Notify via Socket.io
    io.emit("permit_updated", updated);
    io.to(`permit_${id}`).emit("update", updated);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/v1/permits/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to update permit" });
  }
});

// ✅ Permits: DELETE
app.delete("/api/v1/permits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First delete related records (Prisma doesn't auto cascade in SQLite without FK setup)
    await prisma.document.deleteMany({ where: { permitId: id } });
    await prisma.signature.deleteMany({ where: { permitId: id } });
    await prisma.auditLog.deleteMany({ where: { permitId: id } });

    await prisma.permit.delete({
      where: { id },
    });

    return res.json({ success: true, message: "Permit deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/v1/permits/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete permit" });
  }
});

// ✅ Permits: Dashboard Stats
app.get("/api/v1/permits/stats/dashboard", async (_req: Request, res: Response) => {
  try {
    const totalPermits = await prisma.permit.count();
    const activePermits = await prisma.permit.count({ where: { status: 'active' } });
    const pendingApprovals = await prisma.permit.count({ where: { status: 'pending' } });
    const completedPermits = await prisma.permit.count({ where: { status: 'completed' } });
    const expiredPermits = await prisma.permit.count({ where: { validUntil: { lt: new Date() } } });

    // Recent 5 permits
    const recentPermits = await prisma.permit.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { fullName: true }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        totalPermits,
        activePermits,
        pendingApprovals,
        completedPermits,
        expiredPermits,
        recentPermits
      }
    });
  } catch (err: any) {
    console.error("GET /api/v1/permits/stats/dashboard error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// ==================== ANALYTICS API ====================

// ✅ Advanced Analytics Data
app.get("/api/v1/analytics/summary", async (_req: Request, res: Response) => {
  try {
    const statusCounts = await prisma.permit.groupBy({
      by: ['status'],
      _count: true
    });

    const riskLevelCounts = await prisma.permit.groupBy({
      by: ['riskLevel'],
      _count: true
    });

    const typeCounts = await prisma.permit.groupBy({
      by: ['ptwType'],
      _count: true
    });

    // Monthly permit creation trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const permits = await prisma.permit.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    });

    const monthlyTrend: Record<string, number> = {};
    permits.forEach(p => {
      const month = p.createdAt.toLocaleString('default', { month: 'short' });
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        byStatus: statusCounts,
        byRisk: riskLevelCounts,
        byType: typeCounts,
        monthlyTrend
      }
    });
  } catch (err: any) {
    console.error("GET /api/v1/analytics/summary error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

// ==================== CONTRACTORS API ====================

app.get("/api/v1/contractors", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { company: { contains: search as string } },
      ];
    }
    const contractors = await prisma.contractor.findMany({ where });
    return res.json({ success: true, data: contractors });
  } catch (err: any) {
    console.error("GET /api/v1/contractors error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch contractors" });
  }
});

app.get("/api/v1/contractors/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    return res.json({ success: true, data: contractor });
  } catch (err: any) {
    console.error("GET /api/v1/contractors/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch contractor" });
  }
});

app.post("/api/v1/contractors", async (req: Request, res: Response) => {
  try {
    const contractor = await prisma.contractor.create({ data: req.body });
    return res.status(201).json({ success: true, data: contractor });
  } catch (err: any) {
    console.error("POST /api/v1/contractors error:", err);
    return res.status(500).json({ success: false, error: "Failed to create contractor" });
  }
});

// ==================== HANDOVERS & CHECKLISTS API ====================

// ✅ Handover: CREATE
app.post("/api/v1/permits/:id/handovers", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { outgoingIssuerName, incomingIssuerName, notes, outgoingSignatureUrl, incomingSignatureUrl } = req.body;

    const handover = await prisma.permitHandover.create({
      data: {
        permitId: id,
        outgoingIssuerName,
        incomingIssuerName,
        notes,
        outgoingSignatureUrl,
        incomingSignatureUrl,
      }
    });

    // Log to audit
    await createAuditLog({
      userId: "system", // In real app, get from auth context
      action: "PERMIT_HANDOVER",
      entityType: "PermitHandover",
      entityId: handover.id,
      permitId: id,
      details: { incomingBinder: incomingIssuerName },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, data: handover });
  } catch (err: any) {
    console.error("POST /api/v1/permits/:id/handovers error:", err);
    return res.status(500).json({ success: false, error: "Failed to create handover" });
  }
});

// ✅ Handover: GET LIST
app.get("/api/v1/permits/:id/handovers", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const handovers = await prisma.permitHandover.findMany({
      where: { permitId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: handovers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch handovers" });
  }
});

// ✅ Daily Checklist: CREATE
app.post("/api/v1/permits/:id/checklists", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checkedByName, isSafe, comments } = req.body;

    const checklist = await prisma.dailyChecklist.create({
      data: {
        permitId: id,
        checkedByName,
        isSafe,
        comments
      }
    });

    io.to(`permit_${id}`).emit("checklist_added", { permitId: id, checklist });

    return res.status(201).json({ success: true, data: checklist });
  } catch (err: any) {
    console.error("POST /checklists error", err);
    return res.status(500).json({ success: false, error: "Failed to create checklist" });
  }
});

// ✅ Daily Checklist: GET LIST
app.get("/api/v1/permits/:id/checklists", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checklists = await prisma.dailyChecklist.findMany({
      where: { permitId: id },
      orderBy: { checkDate: 'desc' }
    });
    return res.json({ success: true, data: checklists });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch checklists" });
  }
});

// ✅ Request Closure
app.post("/api/v1/permits/:id/request-closure", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requestedBy } = req.body;

    const permit = await prisma.permit.update({
      where: { id },
      data: {
        closureRequested: true,
        closureRequestedBy: requestedBy,
        closureRequestedAt: new Date(),
      }
    });

    io.to(`permit_${id}`).emit("update", permit);

    return res.json({ success: true, data: permit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to request closure" });
  }
});

// ✅ Engineering Approval (Crane)
app.post("/api/v1/permits/:id/approve-engineering", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedById } = req.body; // In real auth, get from token

    const permit = await prisma.permit.update({
      where: { id },
      data: {
        status: 'pending', // Move to pending (waiting for operational approval) or active
        engineeringApprovedById: approvedById,
        engineeringApprovedAt: new Date(),
      }
    });

    await createAuditLog({
      userId: approvedById,
      action: "ENGINEERING_APPROVE",
      entityType: "Permit",
      entityId: id,
      permitId: id,
      details: { status: 'pending' },
      ipAddress: req.ip
    });

    return res.json({ success: true, data: permit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to approve permit" });
  }
});

// ✅ Gas Test Records: CREATE
app.post("/api/v1/permits/:id/gas-test-records", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { testTime, oxygen, co2, lel, toxic, co, testedBy } = req.body;

    const record = await prisma.gasTestRecord.create({
      data: {
        permitId: id,
        testTime,
        oxygen,
        co2,
        lel,
        toxic,
        co,
        testedBy
      }
    });

    io.to(`permit_${id}`).emit("gas_test_added", { record });
    return res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    console.error("POST /gas-test-records error:", err);
    return res.status(500).json({ success: false, error: "Failed to add gas test record" });
  }
});

// ✅ Gas Test Records: GET
app.get("/api/v1/permits/:id/gas-test-records", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const records = await prisma.gasTestRecord.findMany({
      where: { permitId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch gas test records" });
  }
});

// ==================== CERTIFICATE RECORDS API ====================

// ✅ Certificate Records: POST
app.post("/api/v1/permits/:id/certificates", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { certificateType, certificateNo, holderName, issueDate, expiryDate, issuingAuthority, notes } = req.body;

    const certificate = await prisma.certificateRecord.create({
      data: {
        permitId: id,
        certificateType,
        certificateNo,
        holderName,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        issuingAuthority,
        notes
      }
    });

    return res.status(201).json({ success: true, data: certificate });
  } catch (err: any) {
    console.error("POST /certificates error:", err);
    return res.status(500).json({ success: false, error: "Failed to add certificate record" });
  }
});

// ✅ Certificate Records: GET
app.get("/api/v1/permits/:id/certificates", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const records = await prisma.certificateRecord.findMany({
      where: { permitId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch certificates" });
  }
});

// ==================== LOCATIONS API ====================

app.get("/api/v1/locations", async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { building: { contains: search as string } },
      ];
    }
    const locations = await prisma.location.findMany({ where });
    return res.json({ success: true, data: locations });
  } catch (err: any) {
    console.error("GET /api/v1/locations error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch locations" });
  }
});

app.get("/api/v1/locations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await prisma.location.findUnique({ where: { id } });
    return res.json({ success: true, data: location });
  } catch (err: any) {
    console.error("GET /api/v1/locations/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch location" });
  }
});

app.post("/api/v1/locations", async (req: Request, res: Response) => {
  try {
    const { name, building, floor, zone, description, riskLevel } = req.body;

    // Basic validation
    if (!name || !building || !floor || !zone || !riskLevel) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const location = await prisma.location.create({
      data: { name, building, floor, zone, description, riskLevel }
    });
    return res.status(201).json({ success: true, data: location });
  } catch (err: any) {
    console.error("POST /api/v1/locations error:", err);
    return res.status(500).json({ success: false, error: "Failed to create location" });
  }
});

app.put("/api/v1/locations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await prisma.location.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: location });
  } catch (err: any) {
    console.error("PUT /api/v1/locations/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to update location" });
  }
});

app.delete("/api/v1/locations/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id } });
    return res.json({ success: true, message: "Location deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/v1/locations/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete location" });
  }
});

// Placeholder auth endpoint
app.post("/api/v1/auth/login", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Login endpoint - Coming soon",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.stack || err);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

httpServer.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log("=================================");
});
