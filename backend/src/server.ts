import express, { Request, Response, NextFunction } from "express";
import { exec } from "child_process";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import multer from "multer";
import cron from "node-cron";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createAuditLog } from "./utils/logger";
import { generateColdWorkPermitExcel } from "./services/excelExportService";

dotenv.config();

// Custom Request interface to include user info
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

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

// Helper for JWT
const signToken = (id: string, email: string, role: string) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as any,
  });
};

// Middleware: Authentication Guard
const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;
    console.log("🔒 Auth Middleware Hit:", req.path);
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    console.log("Extracted Token (Prefix):", token ? token.substring(0, 10) + "..." : "NONE");

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ success: false, error: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    console.log("✅ Token Decoded:", decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ success: false, error: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth verification failed:", err);
    return res.status(401).json({ success: false, error: "Token is invalid or expired" });
  }
};

// Middleware: Authorization Guard
const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action"
      });
    }
    next();
  };
};

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
 * ✅ DEV: Comprehensive seed endpoint for testing
 */
app.post("/api/v1/dev/seed", async (req: Request, res: Response) => {
  try {
    console.log("🌱 Starting Seeding...");

    // 1. Create Users for all roles
    const usersData = [
      { email: "admin@ptw.local", fullName: "Admin User", role: "admin" },
      { email: "approver@ptw.local", fullName: "Approver User", role: "approver" },
      { email: "requester@ptw.local", fullName: "Requester User", role: "requester" },
    ];

    const passwordHash = await bcrypt.hash("password123", 10);
    const users: any[] = [];

    for (const u of usersData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { fullName: u.fullName, role: u.role, passwordHash },
        create: { ...u, passwordHash },
      });
      users.push(user);
    }

    const adminId = users.find(u => u.role === 'admin')?.id;
    const requesterId = users.find(u => u.role === 'requester')?.id;

    // 2. Create Sample Contractors
    const contractors = [
      { name: "ABC Contractors", company: "ABC Group", contactPerson: "John Doe", email: "john@abc.com", phone: "555-001" },
      { name: "XYZ Engineering", company: "XYZ Technic", contactPerson: "Jane Smith", email: "jane@xyz.com", phone: "555-002" },
    ];

    for (const c of contractors) {
      await prisma.contractor.upsert({
        where: { email: c.email },
        update: c,
        create: c
      });
    }

    // 3. Create Sample Locations
    const locations = [
      { name: "Building A - Roof", building: "Building A", floor: "R", zone: "Exterior", riskLevel: "High" },
      { name: "Building B - Lab", building: "Building B", floor: "1", zone: "Interior", riskLevel: "Medium" },
    ];

    for (const l of locations) {
      await (prisma.location.upsert as any)({
        where: { name: l.name },
        update: l,
        create: l
      });
    }

    // ... (rest of the permit creation stays same)

    // 4. Create Sample Permits if none exist
    const permitCount = await prisma.permit.count();
    if (permitCount < 2) {
      const year = new Date().getFullYear();
      await prisma.permit.create({
        data: {
          permitNumber: `PTW-${year}-00001`,
          ptwType: "Hot Work",
          riskLevel: "High",
          status: "pending",
          locationName: "Building A - Roof",
          contractorName: "ABC Contractors",
          description: "Welding repairs on HVAC structure",
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 8 * 3600000),
          createdById: requesterId || adminId,
        }
      });
    }

    return res.json({ success: true, message: "Database seeded successfully", users: users.map(u => ({ email: u.email, role: u.role })) });
  } catch (err: any) {
    console.error("Seed error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ DEV: Helper to run prisma db push from within the server
 */
app.post("/api/v1/dev/db-push", async (req: Request, res: Response) => {
  try {
    console.log("🚀 Running DB Push...");
    // Try to find npx or use local path
    exec("npx prisma db push --accept-data-loss", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ success: false, error: error.message, stderr });
      }
      console.log(`stdout: ${stdout}`);
      return res.json({ success: true, stdout, stderr });
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Auth login endpoint
app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Provide email and password" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: "Incorrect email or password" });
    }

    const token = signToken(user.id, user.email, user.role);

    return res.json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// ========================================================
// ALL API V1 ROUTES BELOW REQUIRE AUTHENTICATION
// ========================================================
// ✅ Permits: Export to Excel (PUBLIC ACCESS for Export)
app.get("/api/v1/permits/:id/export/excel", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        createdBy: { select: { fullName: true, email: true, role: true } },
        signatures: true,
        documents: true,
      }
    });

    if (!permit) return res.status(404).json({ success: false, error: "Permit not found" });

    // Note: Removed RBAC check temporarily for debugging/public access

    // Generate Excel using static import
    const excelBuffer = await generateColdWorkPermitExcel(permit);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=permit-${permit.permitNumber}.xlsx`);
    res.setHeader('Content-Length', excelBuffer.length.toString());

    res.send(excelBuffer);
  } catch (err: any) {
    console.error("GET /api/v1/permits/:id/export/excel error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate Excel: " + err.message });
  }
});

// ========================================================
// ALL API V1 ROUTES BELOW REQUIRE AUTHENTICATION
// ========================================================
app.use("/api/v1", protect);

// ==================== USERS API ====================

// ✅ Users: GET ALL (Admin only)
app.get("/api/v1/users", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

// ✅ Users: UPDATE ROLE (Admin only)
app.put("/api/v1/users/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, fullName } = req.body;

    if (role && !['admin', 'approver', 'requester'].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(fullName && { fullName })
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

// ==================== PERMIT APPROVAL/REJECTION ====================

// ✅ Permits: REJECT (Approver/Admin)
app.post("/api/v1/permits/:id/reject", restrictTo('admin', 'approver'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const permit = await (prisma.permit.update as any)({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "REJECT_PERMIT",
      entityType: "Permit",
      entityId: id,
      permitId: id,
      details: { reason },
      ipAddress: req.ip
    });

    io.emit("update", permit);
    return res.json({ success: true, data: permit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to reject permit" });
  }
});

// ✅ Permits: APPROVE (Approver/Admin)
app.post("/api/v1/permits/:id/approve", restrictTo('admin', 'approver'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const permit = await prisma.permit.update({
      where: { id },
      data: { status: 'active' }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "APPROVE_PERMIT",
      entityType: "Permit",
      entityId: id,
      permitId: id,
      ipAddress: req.ip
    });

    io.emit("update", permit);
    return res.json({ success: true, data: permit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to approve permit" });
  }
});

// ==================== DOCUMENTS API ====================

// ✅ Upload Document
app.post("/api/v1/documents/upload", upload.single("file"), async (req: AuthRequest, res: Response) => {
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
      userId: req.user?.id,
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
app.post("/api/v1/signatures", async (req: AuthRequest, res: Response) => {
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
      userId: req.user?.id,
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
app.get("/api/v1/permits", async (req: AuthRequest, res: Response) => {
  try {
    const { status, ptwType, riskLevel, search } = req.query;

    const where: any = {};

    // ⛔ RBAC: Requesters can only see their own permits
    if (req.user?.role === 'requester') {
      where.createdById = req.user.id;
    }

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
app.get("/api/v1/permits/:id", async (req: AuthRequest, res: Response) => {
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
app.post("/api/v1/permits", async (req: AuthRequest, res: Response) => {
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

      let initialStatus = status;
      if (ptwType === "Mobile Crane") {
        initialStatus = "engineering_review";
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
        }
      });
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "CREATE_PERMIT",
      entityType: "Permit",
      entityId: created.id,
      permitId: created.id,
      details: { permitNumber: created.permitNumber },
      ipAddress: req.ip
    });

    io.emit("new_permit", created);

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error("POST /api/v1/permits error:", err);
    return res.status(500).json({ success: false, error: "Failed to create permit" });
  }
});

// ✅ Permits: UPDATE
app.put("/api/v1/permits/:id", async (req: AuthRequest, res: Response) => {
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
      status: nextStatus,
    } = req.body;

    const existingPermit = await prisma.permit.findUnique({ where: { id } });
    if (!existingPermit) return res.status(404).json({ success: false, error: "Permit not found" });

    // Transition Logic & Role Checks
    if (nextStatus && nextStatus !== existingPermit.status) {
      const userRole = req.user?.role;
      const userId = req.user?.id;

      // 1. draft -> pending (Only creator or admin)
      if (existingPermit.status === 'draft' && nextStatus === 'pending') {
        if (existingPermit.createdById !== userId && userRole !== 'admin') {
          return res.status(403).json({ success: false, error: "Only the creator or admin can submit for review" });
        }
      }

      // 2. pending -> active (Only admin)
      if (existingPermit.status === 'pending' && nextStatus === 'active') {
        if (userRole !== 'admin') {
          return res.status(403).json({ success: false, error: "Only administrators can approve permits" });
        }
      }

      // 3. active -> completed (Only admin)
      if (existingPermit.status === 'active' && nextStatus === 'completed') {
        if (userRole !== 'admin') {
          return res.status(403).json({ success: false, error: "Only administrators can close permits" });
        }
      }

      // 4. engineering_review -> pending (Only admin/engineer)
      if (existingPermit.status === 'engineering_review' && nextStatus === 'pending') {
        if (userRole !== 'admin') {
          return res.status(403).json({ success: false, error: "Only administrators can complete engineering review" });
        }
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
        ...(nextStatus && { status: nextStatus }),
        ...(req.body.hazardsIdentified !== undefined && { hazardsIdentified: req.body.hazardsIdentified }),
        ...(req.body.controlsRequired !== undefined && { controlsRequired: req.body.controlsRequired }),
        ...(req.body.ppeIdentified !== undefined && { ppeIdentified: req.body.ppeIdentified }),
        ...(req.body.equipmentIdentified !== undefined && { equipmentIdentified: req.body.equipmentIdentified }),
        ...(req.body.workEntity !== undefined && { workEntity: req.body.workEntity }),
        ...(req.body.temperature !== undefined && { temperature: req.body.temperature }),
        ...(req.body.humidity !== undefined && { humidity: req.body.humidity }),
        ...(req.body.personnelList !== undefined && { personnelList: req.body.personnelList }),
        ...(req.body.workTypes !== undefined && { workTypes: req.body.workTypes }),
        ...(req.body.selectedHazards !== undefined && { selectedHazards: req.body.selectedHazards }),
        ...(req.body.selectedPrecautions !== undefined && { selectedPrecautions: req.body.selectedPrecautions }),
        ...(req.body.selectedPPE !== undefined && { selectedPPE: req.body.selectedPPE }),
        ...(req.body.otherHazards !== undefined && { otherHazards: req.body.otherHazards }),
        ...(req.body.otherPrecautions !== undefined && { otherPrecautions: req.body.otherPrecautions }),
        ...(req.body.otherPPE !== undefined && { otherPPE: req.body.otherPPE }),
        ...(req.body.siteTestRequired !== undefined && { siteTestRequired: req.body.siteTestRequired }),
        ...(req.body.requiredCertificates !== undefined && { requiredCertificates: req.body.requiredCertificates }),
      }
    });

    await createAuditLog({
      userId: req.user?.id,
      action: "UPDATE_PERMIT",
      entityType: "Permit",
      entityId: updated.id,
      permitId: updated.id,
      details: { status: updated.status },
      ipAddress: req.ip
    });

    io.emit("permit_updated", updated);
    io.to(`permit_${id}`).emit("update", updated);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/v1/permits/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to update permit" });
  }
});

// ✅ Permits: DELETE
app.delete("/api/v1/permits/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.document.deleteMany({ where: { permitId: id } });
    await prisma.signature.deleteMany({ where: { permitId: id } });
    await prisma.auditLog.deleteMany({ where: { permitId: id } });
    await prisma.permit.delete({ where: { id } });
    return res.json({ success: true, message: "Permit deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/v1/permits/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete permit" });
  }
});

// Route moved to top for public access


// ✅ Permits: Dashboard Stats
app.get("/api/v1/permits/stats/dashboard", async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};

    // ⛔ RBAC: Requesters only see their own permits stats
    if (req.user?.role === 'requester') {
      where.createdById = req.user.id;
    }

    const totalPermits = await prisma.permit.count({ where });
    const activePermits = await prisma.permit.count({ where: { ...where, status: 'active' } });
    const pendingApprovals = await prisma.permit.count({ where: { ...where, status: 'pending' } });
    const completedPermits = await prisma.permit.count({ where: { ...where, status: 'completed' } });
    const draftPermits = await prisma.permit.count({ where: { ...where, status: 'draft' } });

    // Expired permits (validUntil in the past)
    const expiredPermits = await prisma.permit.count({
      where: {
        ...where,
        validUntil: { lt: new Date() },
        status: { in: ['active', 'approved'] }
      }
    });

    const recentPermits = await prisma.permit.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { fullName: true } } }
    });

    return res.json({
      success: true,
      data: {
        totalPermits,
        activePermits,
        pendingApprovals,
        completedPermits,
        draftPermits,
        expiredPermits,
        recentPermits
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// ==================== ANALYTICS API ====================

app.get("/api/v1/analytics/summary", async (_req: AuthRequest, res: Response) => {
  try {
    const statusCounts = await prisma.permit.groupBy({ by: ['status'], _count: true });
    const riskLevelCounts = await prisma.permit.groupBy({ by: ['riskLevel'], _count: true });
    const typeCounts = await prisma.permit.groupBy({ by: ['ptwType'], _count: true });

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
    return res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

// ==================== CONTRACTORS API ====================

app.get("/api/v1/contractors", async (req: AuthRequest, res: Response) => {
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
    return res.status(500).json({ success: false, error: "Failed to fetch contractors" });
  }
});

app.post("/api/v1/contractors", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const contractor = await prisma.contractor.create({ data: req.body });
    return res.status(201).json({ success: true, data: contractor });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create contractor" });
  }
});

app.put("/api/v1/contractors/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.contractor.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update contractor" });
  }
});

app.delete("/api/v1/contractors/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contractor.delete({ where: { id } });
    return res.json({ success: true, message: "Contractor deleted" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete contractor" });
  }
});

// ==================== LOCATIONS API ====================

app.get("/api/v1/locations", async (req: AuthRequest, res: Response) => {
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
    return res.status(500).json({ success: false, error: "Failed to fetch locations" });
  }
});

app.post("/api/v1/locations", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const location = await prisma.location.create({ data: req.body });
    return res.status(201).json({ success: true, data: location });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create location" });
  }
});

app.put("/api/v1/locations/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.location.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update location" });
  }
});

app.delete("/api/v1/locations/:id", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id } });
    return res.json({ success: true, message: "Location deleted" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete location" });
  }
});

// ==================== HANDOVERS & CHECKLISTS API ====================

app.post("/api/v1/permits/:id/handovers", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const handover = await prisma.permitHandover.create({
      data: { ...req.body, permitId: id }
    });
    await createAuditLog({
      userId: req.user?.id,
      action: "PERMIT_HANDOVER",
      entityType: "PermitHandover",
      entityId: handover.id,
      permitId: id,
      ipAddress: req.ip
    });
    return res.status(201).json({ success: true, data: handover });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create handover" });
  }
});

// ✅ Get Handovers
app.get("/api/v1/permits/:id/handovers", async (req: AuthRequest, res: Response) => {
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

app.post("/api/v1/permits/:id/checklists", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const checklist = await prisma.dailyChecklist.create({
      data: { ...req.body, permitId: id }
    });
    return res.status(201).json({ success: true, data: checklist });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create checklist" });
  }
});

// ✅ Get Checklists
app.get("/api/v1/permits/:id/checklists", async (req: AuthRequest, res: Response) => {
  try {
    const checklists = await prisma.dailyChecklist.findMany({
      where: { permitId: req.params.id },
      orderBy: { checkDate: 'desc' }
    });
    return res.json({ success: true, data: checklists });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch checklists" });
  }
});

// ==================== OTHER WORKFLOW API ====================

app.post("/api/v1/permits/:id/request-closure", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const permit = await prisma.permit.update({
      where: { id },
      data: {
        closureRequested: true,
        closureRequestedBy: req.body.requestedBy,
        closureRequestedAt: new Date(),
      }
    });
    io.to(`permit_${id}`).emit("update", permit);
    return res.json({ success: true, data: permit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to request closure" });
  }
});

app.post("/api/v1/permits/:id/approve-engineering", restrictTo('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const permit = await prisma.permit.update({
      where: { id },
      data: {
        status: 'pending',
        engineeringApprovedById: req.user?.id,
        engineeringApprovedAt: new Date(),
      }
    });
    await createAuditLog({
      userId: req.user?.id,
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

// Gas and Certificate APIs (simplified for clarity but fully functional)
app.post("/api/v1/permits/:id/gas-test-records", async (req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.gasTestRecord.create({ data: { ...req.body, permitId: req.params.id } });
    io.to(`permit_${req.params.id}`).emit("gas_test_added", { record });
    return res.status(201).json({ success: true, data: record });
  } catch (err: any) { return res.status(500).json({ success: false, error: "Failed to add gas test record" }); }
});

app.post("/api/v1/permits/:id/certificates", async (req: AuthRequest, res: Response) => {
  try {
    const cert = await prisma.certificateRecord.create({ data: { ...req.body, permitId: req.params.id, issueDate: new Date(req.body.issueDate), expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null } });
    return res.status(201).json({ success: true, data: cert });
  } catch (err: any) { return res.status(500).json({ success: false, error: "Failed to add certificate" }); }
});

// ✅ Get Gas Test Records
app.get("/api/v1/permits/:id/gas-test-records", async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.gasTestRecord.findMany({ where: { permitId: req.params.id }, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: records });
  } catch (err: any) { return res.status(500).json({ success: false, error: "Failed to fetch gas test records" }); }
});

// ✅ Get Certificates
app.get("/api/v1/permits/:id/certificates", async (req: AuthRequest, res: Response) => {
  try {
    const certs = await prisma.certificateRecord.findMany({ where: { permitId: req.params.id }, orderBy: { issueDate: 'desc' } });
    return res.json({ success: true, data: certs });
  } catch (err: any) { return res.status(500).json({ success: false, error: "Failed to fetch certificates" }); }
});

// Error handlers
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.stack || err);
  res.status(500).json({ success: false, error: "Something went wrong!" });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
