// Sample data seed script
// Run this to populate the database with test data

const API_BASE = 'http://localhost:4000/api/v1';

async function seedDatabase() {
    console.log('🌱 Triggering backend seeding...');
    try {
        const res = await fetch(`${API_BASE}/dev/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            console.log('✅ Database seeded successfully!');
            console.log('Users created:', data.users);
        } else {
            console.error('❌ Seeding failed:', data.error);
        }
    } catch (err) {
        console.error('❌ Connection error:', err.message);
    }
}

seedDatabase();
