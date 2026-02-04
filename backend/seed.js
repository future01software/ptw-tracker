// Sample data seed script
// Run this to populate the database with test data

const API_BASE = 'http://localhost:4000/api/v1';

async function seedDatabase() {
    console.log('🌱 Seeding database...\n');

    // 1. Create a user first
    console.log('Creating user...');
    const userResponse = await fetch(`${API_BASE}/dev/seed-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@ptw.local',
            fullName: 'Admin User',
            role: 'admin'
        })
    });
    const user = await userResponse.json();
    console.log('✅ User created:', user.data.id);
    const userId = user.data.id;

    // 2. Create contractors
    console.log('\nCreating contractors...');
    const contractors = [
        {
            name: 'ABC Contractors Ltd',
            company: 'ABC Construction Group',
            contactPerson: 'Michael Brown',
            email: 'michael@abccontractors.com',
            phone: '+1 (555) 123-4567',
            certificationNumber: 'CERT-2024-001',
            certificationExpiry: '2025-12-31'
        },
        {
            name: 'XYZ Engineering',
            company: 'XYZ Technical Services',
            contactPerson: 'Jennifer Lee',
            email: 'jennifer@xyzeng.com',
            phone: '+1 (555) 234-5678',
            certificationNumber: 'CERT-2024-002',
            certificationExpiry: '2025-10-15'
        },
        {
            name: 'SafeWork Solutions',
            company: 'SafeWork International',
            contactPerson: 'David Wilson',
            email: 'david@safework.com',
            phone: '+1 (555) 345-6789',
            certificationNumber: 'CERT-2024-003',
            certificationExpiry: '2026-03-20'
        }
    ];

    for (const contractor of contractors) {
        const res = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contractor)
        });
        const data = await res.json();
        console.log('✅ Contractor created:', data.data.name);
    }

    // 3. Create locations
    console.log('\nCreating locations...');
    const locations = [
        {
            name: 'Building A - Floor 5',
            building: 'Building A',
            floor: 'Floor 5',
            zone: 'Production Area',
            description: 'Main production floor with heavy machinery',
            riskLevel: 'High'
        },
        {
            name: 'Building B - Floor 3',
            building: 'Building B',
            floor: 'Floor 3',
            zone: 'Office Area',
            description: 'Administrative offices and meeting rooms',
            riskLevel: 'Low'
        },
        {
            name: 'Building C - Floor 1',
            building: 'Building C',
            floor: 'Floor 1',
            zone: 'Warehouse',
            description: 'Storage and logistics area',
            riskLevel: 'Medium'
        },
        {
            name: 'Building A - Basement',
            building: 'Building A',
            floor: 'Basement',
            zone: 'Utilities',
            description: 'Mechanical and electrical equipment rooms',
            riskLevel: 'High'
        }
    ];

    for (const location of locations) {
        const res = await fetch(`${API_BASE}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
        });
        const data = await res.json();
        console.log('✅ Location created:', data.data.name);
    }

    // 4. Create permits
    console.log('\nCreating permits...');
    const permits = [
        {
            ptwType: 'Hot Work',
            riskLevel: 'High',
            locationName: 'Building A - Floor 5',
            contractorName: 'ABC Contractors Ltd',
            description: 'Welding work on steel beams for structural reinforcement',
            validFrom: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            validUntil: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours from now
            createdById: userId,
            status: 'active'
        },
        {
            ptwType: 'Electrical',
            riskLevel: 'Medium',
            locationName: 'Building B - Floor 3',
            contractorName: 'XYZ Engineering',
            description: 'Installation of new electrical panels and wiring',
            validFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
            validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
            createdById: userId,
            status: 'pending'
        },
        {
            ptwType: 'Cold Work',
            riskLevel: 'Low',
            locationName: 'Building C - Floor 1',
            contractorName: 'SafeWork Solutions',
            description: 'Installation of shelving units in warehouse',
            validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
            validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
            createdById: userId,
            status: 'completed'
        },
        {
            ptwType: 'Confined Space',
            riskLevel: 'High',
            locationName: 'Building A - Basement',
            contractorName: 'ABC Contractors Ltd',
            description: 'Inspection and maintenance of underground tanks',
            validFrom: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            validUntil: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
            createdById: userId,
            status: 'active'
        },
        {
            ptwType: 'Height Work',
            riskLevel: 'High',
            locationName: 'Building B - Floor 3',
            contractorName: 'XYZ Engineering',
            description: 'Roof maintenance and repair work',
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            createdById: userId,
            status: 'draft'
        }
    ];

    for (const permit of permits) {
        const res = await fetch(`${API_BASE}/permits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(permit)
        });
        const data = await res.json();
        console.log('✅ Permit created:', data.data.permitNumber);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nYou can now:');
    console.log('- Visit http://localhost:3000/permits to see permits');
    console.log('- Visit http://localhost:3000/contractors to see contractors');
    console.log('- Visit http://localhost:3000/locations to see locations');
}

// Run the seed function
seedDatabase().catch(console.error);
