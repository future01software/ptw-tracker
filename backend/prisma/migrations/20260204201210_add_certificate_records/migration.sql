-- CreateTable
CREATE TABLE "permit_handovers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_id" TEXT NOT NULL,
    "outgoing_issuer_name" TEXT NOT NULL,
    "incoming_issuer_name" TEXT NOT NULL,
    "handover_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "outgoing_signature_url" TEXT,
    "incoming_signature_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permit_handovers_permit_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "permits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gas_test_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_id" TEXT NOT NULL,
    "test_time" TEXT NOT NULL,
    "oxygen" TEXT,
    "co2" TEXT,
    "lel" TEXT,
    "toxic" TEXT,
    "co" TEXT,
    "tested_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gas_test_records_permit_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "permits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificate_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_id" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "certificate_no" TEXT,
    "holder_name" TEXT NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "expiry_date" DATETIME,
    "issuing_authority" TEXT,
    "document_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificate_records_permit_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "permits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_checklists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_id" TEXT NOT NULL,
    "check_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_by_name" TEXT NOT NULL,
    "is_safe" BOOLEAN NOT NULL DEFAULT true,
    "comments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_checklists_permit_id_fkey" FOREIGN KEY ("permit_id") REFERENCES "permits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "permit_number" TEXT NOT NULL,
    "ptw_type" TEXT NOT NULL,
    "ptw_sub_type" TEXT,
    "risk_level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "location_name" TEXT NOT NULL,
    "contractor_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "valid_from" DATETIME NOT NULL,
    "valid_until" DATETIME NOT NULL,
    "engineering_approved_by_id" TEXT,
    "engineering_approved_at" DATETIME,
    "qr_code_url" TEXT,
    "qr_code_data" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archive_until" DATETIME,
    "created_by_id" TEXT NOT NULL,
    "hazards_identified" BOOLEAN NOT NULL DEFAULT false,
    "controls_required" BOOLEAN NOT NULL DEFAULT false,
    "ppe_identified" BOOLEAN NOT NULL DEFAULT false,
    "equipment_identified" BOOLEAN NOT NULL DEFAULT false,
    "affected_dept_approved" BOOLEAN NOT NULL DEFAULT false,
    "affected_dept_approved_by" TEXT,
    "affected_dept_approved_at" DATETIME,
    "closure_requested" BOOLEAN NOT NULL DEFAULT false,
    "closure_requested_by" TEXT,
    "closure_requested_at" DATETIME,
    "work_entity" TEXT,
    "temperature" TEXT,
    "humidity" TEXT,
    "personnel_list" TEXT,
    "work_types" TEXT,
    "selected_hazards" TEXT,
    "selected_precautions" TEXT,
    "selected_ppe" TEXT,
    "other_hazards" TEXT,
    "other_precautions" TEXT,
    "other_ppe" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "permits_engineering_approved_by_id_fkey" FOREIGN KEY ("engineering_approved_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "permits_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_permits" ("contractor_name", "created_at", "created_by_id", "description", "id", "location_name", "permit_number", "ptw_type", "qr_code_data", "qr_code_url", "risk_level", "status", "updated_at", "valid_from", "valid_until") SELECT "contractor_name", "created_at", "created_by_id", "description", "id", "location_name", "permit_number", "ptw_type", "qr_code_data", "qr_code_url", "risk_level", "status", "updated_at", "valid_from", "valid_until" FROM "permits";
DROP TABLE "permits";
ALTER TABLE "new_permits" RENAME TO "permits";
CREATE UNIQUE INDEX "permits_permit_number_key" ON "permits"("permit_number");
CREATE INDEX "permits_status_idx" ON "permits"("status");
CREATE INDEX "permits_valid_from_valid_until_idx" ON "permits"("valid_from", "valid_until");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
