import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
}).format(safeNumber(value));

const addSectionTitle = (doc, pageWidth, y, title, accentColor) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, y);
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, pageWidth - 14, y + 1.5);
};

/**
 * Genera el PDF de vista previa de un Documento Tributario Electrónico (borrador).
 * NO tiene validez tributaria: no está timbrado ni enviado al SII (falta CAF/LibreDTE).
 *
 * @param {Object} data
 * @param {33|39} data.tipoDte
 * @param {Object} data.emisor - { emisor_rut, emisor_razon_social, emisor_giro, emisor_direccion, emisor_comuna }
 * @param {Object} data.receptor - { nombre, rut, giro, email, telefono, direccion, comuna }
 * @param {Array}  data.detalle - [{ nombre, descripcion, cantidad, unidad, precioUnitario, descuentoPct }]
 * @param {string} data.formaPago
 * @param {string} data.referencias
 * @param {Object} data.totales - { subtotal, descuentoGlobalMonto, montoNeto, iva, total }
 * @param {string} data.codigoInterno
 */
export const generateDtePreview = async (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const darkColor = [15, 23, 42];
    const mutedColor = [71, 85, 105];
    const primaryColor = [22, 78, 140];
    const amberColor = [180, 83, 9];
    const amberFill = [255, 251, 235];

    const emisor = data.emisor || {};
    const receptor = data.receptor || {};
    const totales = data.totales || {};
    const detalle = Array.isArray(data.detalle) ? data.detalle : [];
    const tipoDte = data.tipoDte;

    // Header con logo
    const logoPath = '/logo-native-new.png';
    let logoLoaded = false;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload = () => {
                const logoWidth = 20;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(img, 'PNG', 14, 9, logoWidth, logoHeight);
                logoLoaded = true;
                resolve();
            };
            img.onerror = reject;
            img.src = logoPath;
        });
    } catch {
        // Continúa sin logo
    }

    const titleX = logoLoaded ? 38 : 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.text(emisor.emisor_razon_social || 'Razón social no configurada', titleX, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    const emisorLine2 = [emisor.emisor_rut, emisor.emisor_giro].filter(Boolean).join(' · ');
    if (emisorLine2) doc.text(emisorLine2, titleX, 21);
    const emisorLine3 = [emisor.emisor_direccion, emisor.emisor_comuna].filter(Boolean).join(', ');
    if (emisorLine3) doc.text(emisorLine3, titleX, 25.5);

    // Banner de borrador
    doc.setFillColor(...amberFill);
    doc.setDrawColor(...amberColor);
    doc.roundedRect(14, 30, pageWidth - 28, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...amberColor);
    doc.text('BORRADOR — SIN VALOR TRIBUTARIO (documento no timbrado por el SII, falta CAF)', pageWidth / 2, 35.5, { align: 'center' });

    // Título del documento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    const tipoLabel = tipoDte === 33 ? 'FACTURA ELECTRÓNICA (BORRADOR) — Tipo 33' : 'BOLETA ELECTRÓNICA (BORRADOR) — Tipo 39';
    doc.text(tipoLabel, 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.text('Folio: S/F (pendiente CAF)', pageWidth - 14, 46, { align: 'right' });

    // Receptor
    addSectionTitle(doc, pageWidth, 56, 'Receptor', primaryColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    let y = 62;
    const receptorLines = [
        `Nombre: ${receptor.nombre || '—'}`,
        receptor.rut ? `RUT: ${receptor.rut}` : null,
        receptor.giro ? `Giro: ${receptor.giro}` : null,
        [receptor.direccion, receptor.comuna].filter(Boolean).join(', ') || null,
        [receptor.email, receptor.telefono].filter(Boolean).join(' · ') || null
    ].filter(Boolean);
    receptorLines.forEach((line) => {
        doc.text(line, 14, y);
        y += 5;
    });

    // Detalle
    const detalleStartY = y + 4;
    addSectionTitle(doc, pageWidth, detalleStartY, 'Detalle', primaryColor);

    const detalleRows = detalle.map((line) => {
        const cantidad = safeNumber(line.cantidad);
        const precioUnitario = safeNumber(line.precioUnitario);
        const descuentoPct = safeNumber(line.descuentoPct);
        const subtotal = Math.round(cantidad * precioUnitario * (1 - descuentoPct / 100));
        return [
            line.nombre || '—',
            line.descripcion || '',
            String(cantidad),
            formatCurrency(precioUnitario),
            `${descuentoPct}%`,
            formatCurrency(subtotal)
        ];
    });

    autoTable(doc, {
        startY: detalleStartY + 4,
        head: [['Producto/Servicio', 'Descripción', 'Cant.', 'P. Unit.', '% Desc.', 'Subtotal']],
        body: detalleRows,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { textColor: darkColor, fontSize: 8.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 42 },
            1: { cellWidth: 48 },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 28, halign: 'right' },
            4: { cellWidth: 18, halign: 'right' },
            5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
    });

    let nextY = (doc.lastAutoTable?.finalY || detalleStartY + 20) + 8;
    if (nextY > pageHeight - 70) {
        doc.addPage();
        nextY = 20;
    }

    // Forma de pago / Referencias
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text(`Forma de Pago: ${data.formaPago || '—'}`, 14, nextY);
    nextY += 5;
    if (data.referencias) {
        doc.text(`Referencias: ${data.referencias}`, 14, nextY);
        nextY += 5;
    }

    // Totales alineados a la derecha
    nextY += 4;
    const totalRows = [
        ['Subtotal', formatCurrency(totales.subtotal)],
        ['Descuento Global', formatCurrency(totales.descuentoGlobalMonto)],
        ['Monto Neto', formatCurrency(totales.montoNeto)],
        [tipoDte === 33 || totales.iva > 0 ? 'IVA (19%)' : 'IVA', formatCurrency(totales.iva)],
        ['TOTAL', formatCurrency(totales.total)]
    ];

    autoTable(doc, {
        startY: nextY,
        body: totalRows,
        theme: 'plain',
        bodyStyles: { fontSize: 9.5, textColor: darkColor },
        columnStyles: {
            0: { cellWidth: 40, halign: 'right', textColor: mutedColor },
            1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: pageWidth - 94, right: 14 },
        didParseCell: (cellData) => {
            const label = Array.isArray(cellData.row.raw) ? cellData.row.raw[0] : '';
            if (label === 'TOTAL') {
                cellData.cell.styles.fillColor = amberFill;
                cellData.cell.styles.textColor = amberColor;
                cellData.cell.styles.fontStyle = 'bold';
                cellData.cell.styles.fontSize = 11;
            }
        }
    });

    // Footer
    const generatedAt = new Date().toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(`Generado: ${generatedAt}`, 14, pageHeight - 8);
    doc.text('Documento de prueba — no válido para efectos tributarios', pageWidth - 14, pageHeight - 8, { align: 'right' });

    const fileName = `Borrador-DTE-${data.codigoInterno || 'proyecto'}.pdf`;
    doc.save(fileName);
    return fileName;
};
