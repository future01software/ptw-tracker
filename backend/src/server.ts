import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

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
 * POST /api/v1/dev/seed-user
 * body: { email?, fullName?, role? }
 */
app.post("/api/v1/dev/seed-user", async (req: Request, res: Response) => {
  try {
    const email = req.body?.email || "admin@ptw.local";
    const fullName = req.body?.fullName || "Admin User";
    const role = req.body?.role || "admin";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.json({ success: true, data: existing, message: "User already exists" });
    }

    // Şimdilik dummy hash (Auth'ı sonraki adımda yapacağız)
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: "dummy",
        fullName,
        role,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error("seed-user error:", err);
    return res.status(500).json({ success: false, error: "Failed to seed user" });
  }
});

// ✅ Permits: LIST
app.get("/api/v1/permits", async (_req: Request, res: Response) => {
  try {
    const permits = await prisma.permit.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: permits });
  } catch (err: any) {
    console.error("GET /api/v1/permits error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch permits" });
  }
});

// ✅ Permits: CREATE (PTW-YYYY-00001)
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
        error:
          "Required: ptwType, riskLevel, locationName, contractorName, description, validFrom, validUntil, createdById",
      });
    }

    // createdBy user var mı kontrol (hata mesajı net olsun diye)
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

      return tx.permit.create({
        data: {
          permitNumber,
          ptwType,
          riskLevel,
          status: "draft",
          locationName,
          contractorName,
          description,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          createdById,
          qrCodeUrl: null,
          qrCodeData: null,
        },
      });
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    console.error("POST /api/v1/permits error:", err);
    return res.status(500).json({ success: false, error: "Failed to create permit" });
  }
});

// Placeholder auth endpoint (şimdilik kalsın)
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

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log("=================================");
});
