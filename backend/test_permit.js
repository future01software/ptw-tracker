
async function testPermit() {
    const userId = "1a69fe1a-b5f9-4d02-b921-0ca8c1422f41";
    const permitData = {
        ptwType: "Mobile Crane",
        riskLevel: "High",
        locationName: "Wharf 1",
        contractorName: "ABC Cranes",
        description: "Lifting heavy stiff",
        validFrom: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (1 day notice < 3 days)
        validUntil: new Date(Date.now() + 90000000).toISOString(),
        createdById: userId,
        status: "draft",
        ptwSubType: "Huge Crane"
    };

    try {
        const res = await fetch('http://localhost:4000/api/v1/permits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(permitData)
        });
        const data = await res.json();
        console.log("Create Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

testPermit();
