export type PermitType =
    | 'hot-work'
    | 'confined-space'
    | 'electrical'
    | 'height'
    | 'excavation'
    | 'lifting';

export type PermitStatus =
    | 'pending'
    | 'approved'
    | 'active'
    | 'completed'
    | 'expired'
    | 'rejected'
    | 'draft';

export interface Permit {
    id: string;
    permitNumber: string;
    ptwType: string; // The backend uses ptwType
    status: string;
    title?: string; // Sometimes used in Figma UI
    description: string;
    locationName: string;
    contractorName: string;
    validFrom: string;
    validUntil: string;
    riskLevel: string;
    hazards?: string[]; // Arrays stored as JSON or string? Figma uses arrays.
    precautions?: string[];
    qrCodeUrl?: string;
    qrCodeData?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RiskAssessment {
    permitId: string;
    likelihood: number;
    severity: number;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationFactors: number;
    residualRisk: number;
}
