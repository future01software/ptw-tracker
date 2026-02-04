// API Service Layer for PTW Tracker

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Generic fetch wrapper
async function apiFetch(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// ==================== PERMITS API ====================

export const permitsApi = {
    // Get all permits with optional filters
    getAll: async (filters?: {
        status?: string;
        ptwType?: string;
        riskLevel?: string;
        search?: string;
    }) => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters?.ptwType && filters.ptwType !== 'all') params.append('ptwType', filters.ptwType);
        if (filters?.riskLevel && filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
        if (filters?.search) params.append('search', filters.search);

        const query = params.toString();
        return apiFetch(`/permits${query ? `?${query}` : ''}`);
    },

    // Get single permit by ID
    getById: async (id: string) => {
        return apiFetch(`/permits/${id}`);
    },

    // Create new permit
    create: async (data: any) => {
        return apiFetch('/permits', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update permit
    update: async (id: string, data: Partial<{
        ptwType: string;
        riskLevel: string;
        locationName: string;
        contractorName: string;
        description: string;
        validFrom: string;
        validUntil: string;
        status: string;
    }>) => {
        return apiFetch(`/permits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete permit
    delete: async (id: string) => {
        return apiFetch(`/permits/${id}`, {
            method: 'DELETE',
        });
    },

    // Get dashboard stats
    getStats: async () => {
        return apiFetch('/permits/stats/dashboard');
    },

    // Handover: Create
    createHandover: async (permitId: string, data: any) => {
        return apiFetch(`/permits/${permitId}/handovers`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Handover: Get List
    getHandovers: async (permitId: string) => {
        return apiFetch(`/permits/${permitId}/handovers`);
    },

    // Daily Checklist: Create
    createChecklist: async (permitId: string, data: any) => {
        return apiFetch(`/permits/${permitId}/checklists`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Daily Checklist: Get List
    getChecklists: async (permitId: string) => {
        return apiFetch(`/permits/${permitId}/checklists`);
    },

    // Engineering Approval
    approveEngineering: async (permitId: string, approvedById: string) => {
        return apiFetch(`/permits/${permitId}/approve-engineering`, {
            method: 'POST',
            body: JSON.stringify({ approvedById }),
        });
    },

    // Request Closure
    requestClosure: async (permitId: string, requestedBy: string) => {
        return apiFetch(`/permits/${permitId}/request-closure`, {
            method: 'POST',
            body: JSON.stringify({ requestedBy }),
        });
    },

    // Gas Tests
    getGasTests: async (permitId: string) => {
        return apiFetch(`/permits/${permitId}/gas-test-records`);
    },

    addGasTest: async (permitId: string, data: any) => {
        return apiFetch(`/permits/${permitId}/gas-test-records`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Certificates
    getCertificates: async (permitId: string) => {
        return apiFetch(`/permits/${permitId}/certificates`);
    },

    addCertificate: async (permitId: string, data: any) => {
        return apiFetch(`/permits/${permitId}/certificates`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ==================== CONTRACTORS API ====================

export const contractorsApi = {
    // Get all contractors
    getAll: async (search?: string) => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiFetch(`/contractors${params}`);
    },

    // Get single contractor
    getById: async (id: string) => {
        return apiFetch(`/contractors/${id}`);
    },

    // Create contractor
    create: async (data: {
        name: string;
        company: string;
        contactPerson: string;
        email: string;
        phone: string;
        certificationNumber?: string;
        certificationExpiry?: string;
    }) => {
        return apiFetch('/contractors', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update contractor
    update: async (id: string, data: Partial<{
        name: string;
        company: string;
        contactPerson: string;
        email: string;
        phone: string;
        certificationNumber: string;
        certificationExpiry: string;
        isActive: boolean;
    }>) => {
        return apiFetch(`/contractors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete contractor
    delete: async (id: string) => {
        return apiFetch(`/contractors/${id}`, {
            method: 'DELETE',
        });
    },
};

// ==================== LOCATIONS API ====================

export const locationsApi = {
    // Get all locations
    getAll: async (search?: string) => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiFetch(`/locations${params}`);
    },

    // Get single location
    getById: async (id: string) => {
        return apiFetch(`/locations/${id}`);
    },

    // Create location
    create: async (data: {
        name: string;
        building: string;
        floor: string;
        zone: string;
        description?: string;
        riskLevel: string;
    }) => {
        return apiFetch('/locations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update location
    update: async (id: string, data: Partial<{
        name: string;
        building: string;
        floor: string;
        zone: string;
        description: string;
        riskLevel: string;
        isActive: boolean;
    }>) => {
        return apiFetch(`/locations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete location
    delete: async (id: string) => {
        return apiFetch(`/locations/${id}`, {
            method: 'DELETE',
        });
    },
};

// ==================== DOCUMENTS API ====================

export const documentsApi = {
    upload: async (permitId: string, file: File, type: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('permitId', permitId);
        formData.append('type', type);

        // Fetch wrapper handles JSON by default, need custom for FormData
        const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type, browser will set it with boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }
};

// ==================== SIGNATURES API ====================

export const signaturesApi = {
    submit: async (data: {
        permitId: string;
        role: string;
        signerName: string;
        signatureUrl: string;
    }) => {
        return apiFetch('/signatures', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

// ==================== ANALYTICS API ====================

export const analyticsApi = {
    getSummary: async () => {
        return apiFetch('/analytics/summary');
    }
};

// ==================== USERS API ====================

export const usersApi = {
    // Seed a user (dev only)
    seedUser: async (data?: {
        email?: string;
        fullName?: string;
        role?: string;
    }) => {
        return apiFetch('/dev/seed-user', {
            method: 'POST',
            body: JSON.stringify(data || {}),
        });
    },
};
