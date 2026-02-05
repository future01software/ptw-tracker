import ExcelJS from 'exceljs';
import path from 'path';

/**
 * Generate Excel export for Cold Work Permit (Soğuk İş İzni)
 * @param permit - Full permit object with all relations
 * @returns Excel file buffer
 */
export async function generateColdWorkPermitExcel(permit: any): Promise<Buffer> {
    try {
        const workbook = new ExcelJS.Workbook();
        const templatePath = path.join(__dirname, '../../templates/soguk-is-izni.xlsx');

        // Load the template
        await workbook.xlsx.readFile(templatePath);

        console.log(`📘 Template loaded. Sheets: ${workbook.worksheets.length}`);
        workbook.worksheets.forEach((ws, i) => console.log(`   Sheet ${i}: ${ws.name}`));

        // Try getting by index 1 (ExcelJS default), then 0, then by internal array
        let worksheet = workbook.getWorksheet(1) || workbook.worksheets[0];

        // Use the first worksheet (CWPrenew)
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error("No worksheets found in template");

        console.log("📝 Generating Excel for Permit:", permit.permitNumber);

        // Helper to parse JSON fields safely
        const parseJson = (field: any) => {
            if (!field) return [];
            if (Array.isArray(field)) return field;
            try { return JSON.parse(field); } catch (e) { return []; }
        };

        const hazards = parseJson(permit.selectedHazards);
        const precautions = parseJson(permit.selectedPrecautions);
        const ppe = parseJson(permit.selectedPPE);
        const personnel = parseJson(permit.personnelList);

        console.log(`   - Parsed Data: ${hazards.length} hazards, ${precautions.length} precautions, ${ppe.length} PPE, ${personnel.length} personnel`);

        // ===== SECTION: Header - Kayıt No =====
        worksheet.getCell('J2').value = permit.permitNumber || '';

        // ===== SECTION 1: Faaliyet Bilgileri =====
        worksheet.getCell('B5').value = permit.contractorName || '';
        worksheet.getCell('B6').value = permit.locationName || '';
        worksheet.getCell('B7').value = permit.description || '';
        worksheet.getCell('B8').value = permit.locationName || ''; // Use locationName as work location for now
        worksheet.getCell('B9').value = permit.createdBy?.fullName || '';

        // Start/End Dates
        if (permit.validFrom) {
            const d = new Date(permit.validFrom);
            worksheet.getCell('E5').value = d;
            worksheet.getCell('G5').value = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        if (permit.validUntil) {
            const d = new Date(permit.validUntil);
            worksheet.getCell('E6').value = d;
            worksheet.getCell('G6').value = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }

        // ===== SECTION 2: Teminatlı Tehlikeler (Hazards) =====
        const hazardCheckboxes: Record<string, string> = {
            'Elektrikli Ekipman': 'C12', 'Hızlı Akan Su': 'C13', 'Hava Şartları': 'C14',
            'Personel Eksi': 'C15', 'Toksik Maddeler': 'C16', 'Elektrik Çarpması': 'C17',
            'Bina Taşıma': 'C18', 'Döşeme': 'C19', 'Radyasyon': 'C20',
            'Kaldırma Operasyonları': 'C21', 'Isınma/Tahliye': 'C22', 'Yüksekte Çalışma': 'C23',
            'Gürültü': 'C24'
        };

        hazards.forEach((h: string) => {
            if (hazardCheckboxes[h]) worksheet.getCell(hazardCheckboxes[h]).value = 'X';
        });

        // ===== SECTION 3: Alınacak Önlemler (Precautions) =====
        // Write precautions as list starting at row 28
        let checklistRow = 28;
        precautions.forEach((item: any, index: number) => {
            // Check limit to avoid overwriting other sections
            if (checklistRow + index > 34) return;

            // If item is object {description, checked}, use description. If string, use directly.
            const text = typeof item === 'string' ? item : (item.description || item);

            worksheet.getCell(`C${checklistRow + index}`).value = 'X';
            worksheet.getCell(`D${checklistRow + index}`).value = text;
        });

        // ===== SECTION 4: PPE =====
        // Simple mapping if names match, otherwise just list them? 
        // Template has specific checkboxes. Let's try to map common ones.
        const ppeCheckboxes: Record<string, string> = {
            'Kişisel Koruyucu': 'C35', 'Eldiven': 'C36', 'Yüz/Gözlük': 'C37',
            'İş Maskesi': 'C38', 'Emniyet Kemeri': 'C39'
        };

        ppe.forEach((p: string) => {
            // Fuzzy match or exact match
            const key = Object.keys(ppeCheckboxes).find(k => p.includes(k) || k.includes(p));
            if (key) worksheet.getCell(ppeCheckboxes[key]).value = 'X';
        });

        // ===== SECTION 6: Personnel =====
        let personnelRow = 45;
        personnel.forEach((p: any, index: number) => {
            if (personnelRow + index > 49) return;
            const name = typeof p === 'string' ? p : (p.name || JSON.stringify(p));
            worksheet.getCell(`B${personnelRow + index}`).value = name;
        });

        // ===== SECTION 7 & 8: Signatures =====
        // (Keep existing logic if applicable, but signatures rely on relation which is parsed correctly)
        if (permit.siteAuthority) {
            worksheet.getCell('B50').value = permit.siteAuthority.name || '';
        }

        let approvalRow = 55;
        if (permit.signatures && Array.isArray(permit.signatures)) {
            permit.signatures.forEach((sig: any, index: number) => {
                if (approvalRow + index > 58) return;
                const row = approvalRow + index;
                worksheet.getCell(`B${row}`).value = sig.role || '';
                if (sig.signedAt) worksheet.getCell(`C${row}`).value = new Date(sig.signedAt);
                worksheet.getCell(`D${row}`).value = sig.fullName || '';
            });
        }

        // ===== Additional Data =====
        if (permit.status) {
            const cell = permit.status === 'completed' ? 'C60' : (permit.status === 'cancelled' ? 'C61' : null);
            if (cell) worksheet.getCell(cell).value = 'X';
        }

        if (permit.completedAt) worksheet.getCell('E60').value = new Date(permit.completedAt);
        worksheet.getCell('H2').value = permit.riskLevel || '';
        worksheet.getCell('H3').value = permit.ptwType || '';

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);

    } catch (error) {
        console.error('Error generating Excel:', error);
        throw new Error(`Failed to generate Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get template info
 */
export function getTemplateInfo() {
    return {
        name: 'Soğuk İş İzni',
        filename: 'soguk-is-izni.xlsx',
        version: '1.0',
        sections: [
            'Faaliyet Bilgileri',
            'Teminatlı Tehlikeler',
            'Alınacak Önlemler',
            'İlave Kişisel Koruyucu Ekipman',
            'İlave Sertifikalar',
            'Etkilenen Saha Yetkilileri',
            'Vekil ve Onay',
            'Onay Yetkilileri',
            'İş Tamamlanması/İptal'
        ]
    };
}
