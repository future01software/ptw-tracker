import React from 'react';
import { Permit } from '@/types';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportMenuProps {
  permits: Permit[];
}

const permitTypeLabels: Record<string, string> = {
  'hot-work': 'Hot Work',
  'confined-space': 'Confined Space',
  'electrical': 'Electrical',
  'height': 'Work at Height',
  'excavation': 'Excavation',
  'lifting': 'Lifting Operations'
};

export function ExportMenu({ permits }: ExportMenuProps) {
  const exportToCSV = () => {
    // Create CSV header
    const headers = [
      'Permit Number',
      'Type',
      'Status',
      'Location',
      'Contractor',
      'Risk Level',
      'Description',
      'Valid From',
      'Valid Until',
      'Created At',
      'Hazards',
      'Precautions'
    ];

    // Create CSV rows
    const rows = permits.map(permit => [
      permit.permitNumber,
      permitTypeLabels[permit.ptwType.toLowerCase()] || permit.ptwType,
      permit.status.charAt(0).toUpperCase() + permit.status.slice(1),
      permit.locationName,
      permit.contractorName,
      permit.riskLevel,
      permit.description,
      format(new Date(permit.validFrom), 'yyyy-MM-dd HH:mm'),
      format(new Date(permit.validUntil), 'yyyy-MM-dd HH:mm'),
      format(new Date(permit.createdAt), 'yyyy-MM-dd HH:mm'),
      (permit.hazards || []).join('; '),
      (permit.precautions || []).join('; ')
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `permits_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Permit to Work Report', 14, 22);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 14, 30);
    doc.text(`Total Permits: ${permits.length}`, 14, 36);

    // Prepare table data
    const tableData = permits.map(permit => [
      permit.permitNumber,
      permitTypeLabels[permit.ptwType.toLowerCase()] || permit.ptwType,
      permit.status.charAt(0).toUpperCase() + permit.status.slice(1),
      permit.locationName,
      permit.contractorName,
      permit.riskLevel,
      format(new Date(permit.validFrom), 'MM/dd/yyyy')
    ]);

    // Add table
    autoTable(doc, {
      head: [['Permit #', 'Type', 'Status', 'Location', 'Contractor', 'Risk', 'Start Date']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });

    // Save the PDF
    doc.save(`permits_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
  };

  const exportDetailedPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Detailed Permit to Work Report', 14, 22);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 14, 30);

    let yPosition = 40;

    permits.forEach((permit, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Permit header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(permit.permitNumber, 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Basic info
      doc.text(`Permit Number: ${permit.permitNumber}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Type: ${permitTypeLabels[permit.ptwType.toLowerCase()] || permit.ptwType}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Status: ${permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Location: ${permit.locationName}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Contractor: ${permit.contractorName}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Risk Level: ${permit.riskLevel}`, 14, yPosition);
      yPosition += 5;

      doc.text(`Start: ${format(new Date(permit.validFrom), 'MMM dd, yyyy HH:mm')}`, 14, yPosition);
      yPosition += 5;
      doc.text(`End: ${format(new Date(permit.validUntil), 'MMM dd, yyyy HH:mm')}`, 14, yPosition);
      yPosition += 7;

      // Hazards
      doc.setFont('helvetica', 'bold');
      doc.text('Hazards:', 14, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      (permit.hazards || []).forEach(hazard => {
        doc.text(`• ${hazard}`, 18, yPosition);
        yPosition += 5;
      });
      yPosition += 2;

      // Precautions
      doc.setFont('helvetica', 'bold');
      doc.text('Precautions:', 14, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      (permit.precautions || []).forEach(precaution => {
        doc.text(`• ${precaution}`, 18, yPosition);
        yPosition += 5;
      });

      // Separator
      if (index < permits.length - 1) {
        yPosition += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 10;
      }
    });

    // Save the PDF
    doc.save(`permits_detailed_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="w-4 h-4 mr-2" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export to PDF (Summary)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDetailedPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export to PDF (Detailed)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
