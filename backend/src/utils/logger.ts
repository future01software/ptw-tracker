import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    permitId
}: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
    permitId?: string;
}) {
    try {
        const log = await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ? JSON.stringify(details) : null,
                ipAddress,
                permitId
            }
        });
        return log;
    } catch (err) {
        console.error("Failed to create audit log:", err);
    }
}
