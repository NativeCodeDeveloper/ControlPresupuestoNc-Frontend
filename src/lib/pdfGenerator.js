import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional financial report PDF with company branding
 * @param {Object} stats - Financial statistics from getReportStats
 * @param {string} monthName - Selected month name in Spanish
 * @param {string} year - Selected year
 */
export const generateFinancialReport = async (stats, monthName, year) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [99, 102, 241]; // Indigo
    const darkColor = [30, 41, 59]; // Slate-800
    const mutedColor = [100, 116, 139]; // Slate-500

    // Load logo image
    const logoPath = '/logo-native-new.png';
    let logoLoaded = false;

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            img.onload = () => {
                // Add logo (scaled down appropriately)
                const logoWidth = 25;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(img, 'PNG', 14, 10, logoWidth, logoHeight);
                logoLoaded = true;
                resolve();
            };
            img.onerror = reject;
            img.src = logoPath;
        });
    } catch (e) {
        console.log('Logo could not be loaded, continuing without it');
    }

    // Company name
    const nameX = logoLoaded ? 45 : 14;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('NATIVECODE SPA', nameX, 22);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text('Sistema de Control Financiero', nameX, 28);

    // Separator line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, 38, pageWidth - 14, 38);

    // Report title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('Reporte Financiero', 14, 50);

    // Period
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(`Período: ${monthName} ${year}`, 14, 58);

    // Format currency helper
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val || 0);
    };

    // Financial Summary Table
    const tableData = [
        ['Ingresos Totales', formatCurrency(stats?.income || 0)],
        ['Gastos Operativos', formatCurrency(stats?.expenses || 0)],
        ['Utilidad Operativa', formatCurrency(stats?.operatingResult || 0)],
        ['', ''], // Separator row
        ['Fondo de Emergencia', formatCurrency(stats?.emergencyFundDeduction || 0)],
        ['Reinversión', formatCurrency(stats?.reinvestmentDeduction || 0)],
        ['Total Deducciones', formatCurrency((stats?.emergencyFundDeduction || 0) + (stats?.reinvestmentDeduction || 0))],
        ['', ''], // Separator row
        ['Retiros de Socios', formatCurrency(stats?.withdrawals || 0)],
        ['Utilidad Neta Disponible', formatCurrency(stats?.netProfit || 0)],
    ];

    const tableResult = autoTable(doc, {
        startY: 68,
        head: [['Concepto', 'Monto']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
        },
        bodyStyles: {
            fontSize: 10,
            textColor: darkColor
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate-50
        },
        columnStyles: {
            0: { cellWidth: 110, fontStyle: 'normal' },
            1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            // Style the separator rows
            if (data.row.raw[0] === '' && data.row.raw[1] === '') {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.minCellHeight = 3;
            }
            // Highlight the final row
            if (data.row.raw[0] === 'Utilidad Neta Disponible') {
                data.cell.styles.fillColor = [99, 102, 241];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
            // Highlight totals
            if (data.row.raw[0] === 'Total Deducciones' || data.row.raw[0] === 'Utilidad Operativa') {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [241, 245, 249]; // Slate-100
            }
        },
        margin: { left: 14, right: 14 }
    });

    // Footer
    const finalY = (doc.lastAutoTable?.finalY || 140) + 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...mutedColor);

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    doc.text(`Generado el: ${dateStr}`, 14, finalY);
    doc.text('NATIVECODE SPA - Control Financiero', pageWidth - 14, finalY, { align: 'right' });

    // Save the PDF
    const fileName = `Reporte_Financiero_${monthName}_${year}.pdf`;
    doc.save(fileName);

    return fileName;
};
