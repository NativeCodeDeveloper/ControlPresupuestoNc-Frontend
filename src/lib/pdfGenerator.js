import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
}).format(safeNumber(value));

const drawMetricCard = (doc, {
    x,
    y,
    width,
    height,
    title,
    value,
    subtitle,
    borderColor
}) => {
    doc.setDrawColor(...borderColor);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(title, x + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 3, y + 13);

    if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(subtitle, x + 3, y + 18);
    }
};

const addSectionTitle = (doc, pageWidth, y, title, accentColor) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, y);
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, pageWidth - 14, y + 1.5);
};

/**
 * Generates executive financial report PDF
 * @param {Object} stats - Financial statistics
 * @param {string} monthName - Month label
 * @param {string} year - Year label
 */
export const generateFinancialReport = async (stats, monthName, year) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const primaryColor = [22, 78, 140];
    const accentColor = [79, 70, 229];
    const secondaryBlue = [37, 99, 235];
    const lightBlue = [96, 165, 250];
    const deepBlue = [30, 64, 175];
    const darkColor = [15, 23, 42];
    const mutedColor = [71, 85, 105];
    const softBlueFill = [239, 246, 255];
    const softPurpleFill = [238, 242, 255];

    const income = safeNumber(stats?.income);
    const fixedCosts = safeNumber(stats?.fixedCosts);
    const fixedCostsCommitted = safeNumber(stats?.fixedCostsCommitted ?? fixedCosts);
    const variableCosts = safeNumber(stats?.variableCosts);
    const expenses = fixedCosts + variableCosts;
    const operatingResult = safeNumber(stats?.operatingResult);
    const emergencyDeduction = safeNumber(stats?.emergencyFundDeduction);
    const reinvestmentDeduction = safeNumber(stats?.reinvestmentDeduction);
    const totalAutomaticDeductions = emergencyDeduction + reinvestmentDeduction;
    const netProfit = safeNumber(stats?.netProfit);
    const withdrawals = safeNumber(stats?.withdrawals);

    const fundReinvestAssigned = safeNumber(stats?.fundReinvestAssigned);
    const fundReinvestUsed = safeNumber(stats?.fundReinvestUsed);
    const fundReinvestAvailable = safeNumber(stats?.fundReinvestAvailable);
    const fundEmergencyAssigned = safeNumber(stats?.fundEmergencyAssigned);
    const fundEmergencyUsed = safeNumber(stats?.fundEmergencyUsed);
    const fundEmergencyAvailable = safeNumber(stats?.fundEmergencyAvailable);
    const companyAvailableTotal = fundReinvestAvailable + fundEmergencyAvailable;

    const fallbackPartnersAvailable = Math.max(0, netProfit - withdrawals);
    const partnersAvailablePeriod = Number.isFinite(Number(stats?.totalPartnersAvailable))
        ? safeNumber(stats?.totalPartnersAvailable)
        : fallbackPartnersAvailable;
    const partnersAvailableAccumulated = Number.isFinite(Number(stats?.totalPartnersAvailableAccumulated))
        ? safeNumber(stats?.totalPartnersAvailableAccumulated)
        : partnersAvailablePeriod;

    const consolidatedAvailable = companyAvailableTotal + partnersAvailableAccumulated;
    const partnersAvailability = Array.isArray(stats?.partnersAvailability) ? stats.partnersAvailability : [];

    // Header with logo
    const logoPath = '/logo-native-new.png';
    let logoLoaded = false;

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            img.onload = () => {
                const logoWidth = 23;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(img, 'PNG', 14, 9, logoWidth, logoHeight);
                logoLoaded = true;
                resolve();
            };
            img.onerror = reject;
            img.src = logoPath;
        });
    } catch {
        // Continue without logo
    }

    const titleX = logoLoaded ? 41 : 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...darkColor);
    doc.text('NATIVECODE SPA', titleX, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.text('Informe Ejecutivo de Control Financiero', titleX, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Período evaluado: ${monthName} ${year}`, 14, 35);

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.6);
    doc.line(14, 39, pageWidth - 14, 39);

    // Executive metrics
    addSectionTitle(doc, pageWidth, 47, 'Resumen Ejecutivo', primaryColor);

    const cardGap = 5;
    const cardWidth = (pageWidth - 28 - cardGap) / 2;
    const cardHeight = 22;

    drawMetricCard(doc, {
        x: 14,
        y: 51,
        width: cardWidth,
        height: cardHeight,
        title: 'Ingresos Totales',
        value: formatCurrency(income),
        subtitle: 'Facturación del período',
        borderColor: deepBlue
    });

    drawMetricCard(doc, {
        x: 14 + cardWidth + cardGap,
        y: 51,
        width: cardWidth,
        height: cardHeight,
        title: 'Gastos Operativos',
        value: formatCurrency(expenses),
        subtitle: 'Costos fijos y variables',
        borderColor: lightBlue
    });

    drawMetricCard(doc, {
        x: 14,
        y: 76,
        width: cardWidth,
        height: cardHeight,
        title: 'Utilidad Operativa',
        value: formatCurrency(operatingResult),
        subtitle: 'Antes de deducciones y retiros',
        borderColor: secondaryBlue
    });

    drawMetricCard(doc, {
        x: 14 + cardWidth + cardGap,
        y: 76,
        width: cardWidth,
        height: cardHeight,
        title: 'Total Disponible Empresa',
        value: formatCurrency(companyAvailableTotal),
        subtitle: 'Fondos internos disponibles',
        borderColor: accentColor
    });

    // Statement table
    addSectionTitle(doc, pageWidth, 107, 'Estado de Resultados del Período', primaryColor);

    const statementRows = [
        ['Ingresos Totales', formatCurrency(income)],
        ['Costos Fijos', formatCurrency(fixedCosts)],
        ['Costos Fijos Vigentes (Compromiso)', formatCurrency(fixedCostsCommitted)],
        ['Costos Variables', formatCurrency(variableCosts)],
        ['Gastos Operativos (Fijos + Variables)', formatCurrency(expenses)],
        ['Resultado Operativo', formatCurrency(operatingResult)],
        ['Deducción Fondo de Emergencia', formatCurrency(emergencyDeduction)],
        ['Deducción Reinversión', formatCurrency(reinvestmentDeduction)],
        ['Total Deducciones Automáticas', formatCurrency(totalAutomaticDeductions)],
        ['Utilidad Neta a Distribuir', formatCurrency(netProfit)],
        ['Retiros de Socios (Período)', formatCurrency(withdrawals)],
        ['Disponible para Socios (Período)', formatCurrency(partnersAvailablePeriod)],
        ['Pozo Socios Acumulado', formatCurrency(partnersAvailableAccumulated)],
        ['TOTAL DISPONIBLE EMPRESA', formatCurrency(companyAvailableTotal)],
        ['TOTAL DISPONIBLE CONSOLIDADO', formatCurrency(consolidatedAvailable)]
    ];

    autoTable(doc, {
        startY: 111,
        head: [['Concepto', 'Monto']],
        body: statementRows,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            textColor: darkColor,
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            const rowLabel = Array.isArray(data.row.raw) ? data.row.raw[0] : '';
            if (rowLabel === 'TOTAL DISPONIBLE EMPRESA') {
                data.cell.styles.fillColor = softBlueFill;
                data.cell.styles.textColor = deepBlue;
                data.cell.styles.fontStyle = 'bold';
            }
            if (rowLabel === 'TOTAL DISPONIBLE CONSOLIDADO') {
                data.cell.styles.fillColor = primaryColor;
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 }
    });

    // Company funds section
    let nextY = (doc.lastAutoTable?.finalY || 170) + 8;
    if (nextY > pageHeight - 70) {
        doc.addPage();
        nextY = 20;
    }

    addSectionTitle(doc, pageWidth, nextY, 'Detalle de Fondos de Empresa', accentColor);

    const fundsRows = [
        ['Reinversión', formatCurrency(fundReinvestAssigned), formatCurrency(fundReinvestUsed), formatCurrency(fundReinvestAvailable)],
        ['Emergencia', formatCurrency(fundEmergencyAssigned), formatCurrency(fundEmergencyUsed), formatCurrency(fundEmergencyAvailable)],
        ['TOTAL', formatCurrency(fundReinvestAssigned + fundEmergencyAssigned), formatCurrency(fundReinvestUsed + fundEmergencyUsed), formatCurrency(companyAvailableTotal)]
    ];

    autoTable(doc, {
        startY: nextY + 4,
        head: [['Fondo', 'Asignado', 'Usado', 'Disponible']],
        body: fundsRows,
        theme: 'grid',
        headStyles: {
            fillColor: accentColor,
            textColor: [255, 255, 255],
            fontSize: 9
        },
        bodyStyles: {
            textColor: darkColor,
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 52 },
            1: { cellWidth: 43, halign: 'right' },
            2: { cellWidth: 43, halign: 'right' },
            3: { cellWidth: 44, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            const rowLabel = Array.isArray(data.row.raw) ? data.row.raw[0] : '';
            if (rowLabel === 'TOTAL') {
                data.cell.styles.fillColor = softPurpleFill;
                data.cell.styles.textColor = accentColor;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 }
    });

    // Partners availability section
    nextY = (doc.lastAutoTable?.finalY || 210) + 8;
    if (nextY > pageHeight - 80) {
        doc.addPage();
        nextY = 20;
    }

    addSectionTitle(doc, pageWidth, nextY, 'Disponibilidad por Socio', primaryColor);

    const partnersRows = partnersAvailability.map((partner) => ([
        partner.name || 'Sin nombre',
        `${safeNumber(partner.percentage).toFixed(2)}%`,
        formatCurrency(partner.assigned),
        formatCurrency(partner.withdrawn),
        formatCurrency(partner.available)
    ]));

    const partnersTableBody = partnersRows.length > 0
        ? [...partnersRows, ['TOTAL DISPONIBLE SOCIOS', '', '', '', formatCurrency(partnersAvailablePeriod)]]
        : [['Sin socios configurados', '', '', '', formatCurrency(partnersAvailablePeriod)]];

    autoTable(doc, {
        startY: nextY + 4,
        head: [['Socio', '%', 'Asignado', 'Retirado', 'Disponible']],
        body: partnersTableBody,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 9
        },
        bodyStyles: {
            textColor: darkColor,
            fontSize: 8.7
        },
        columnStyles: {
            0: { cellWidth: 61 },
            1: { cellWidth: 16, halign: 'center' },
            2: { cellWidth: 31, halign: 'right' },
            3: { cellWidth: 31, halign: 'right' },
            4: { cellWidth: 31, halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            const rowLabel = Array.isArray(data.row.raw) ? data.row.raw[0] : '';
            if (rowLabel === 'TOTAL DISPONIBLE SOCIOS') {
                data.cell.styles.fillColor = deepBlue;
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 }
    });

    // Closing block
    nextY = (doc.lastAutoTable?.finalY || 250) + 8;
    if (nextY > pageHeight - 28) {
        doc.addPage();
        nextY = 20;
    }

    doc.setDrawColor(...primaryColor);
    doc.setFillColor(...softBlueFill);
    doc.roundedRect(14, nextY, pageWidth - 28, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.text(`Conclusión ejecutiva: Total disponible para la empresa ${formatCurrency(companyAvailableTotal)}.`, 17, nextY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    doc.text(`Socios período ${formatCurrency(partnersAvailablePeriod)} · Pozo socios acumulado ${formatCurrency(partnersAvailableAccumulated)} · Consolidado ${formatCurrency(consolidatedAvailable)}.`, 17, nextY + 11);

    // Footer
    const now = new Date();
    const generatedAt = now.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    doc.text(`Generado: ${generatedAt}`, 14, pageHeight - 8);
    doc.text('NATIVECODE SPA - Documento para evaluación ejecutiva', pageWidth - 14, pageHeight - 8, { align: 'right' });

    const fileName = `Informe_Financiero_Ejecutivo_${monthName}_${year}.pdf`;
    doc.save(fileName);
    return fileName;
};
