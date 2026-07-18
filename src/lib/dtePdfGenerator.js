import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const INK = [23, 23, 23];
const MUTED = [120, 120, 125];
const FAINT = [165, 165, 170];
const HAIRLINE = [222, 222, 225];
const WATERMARK = [232, 232, 234];

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
}).format(safeNumber(value));

const label = (doc, text, x, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(text.toUpperCase(), x, y, { charSpace: 0.4 });
};

const line = (doc, x1, y, x2) => {
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.25);
    doc.line(x1, y, x2, y);
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
 * @param {string} data.formaPago - Contado | Crédito | Sin costo (entrega gratuita) — <FmaPago> SII
 * @param {string} [data.medioPago] - Efectivo | Transferencia | etc. — <MedioPago> SII, opcional
 * @param {string} [data.fechaVencimiento] - Requerida si formaPago es Crédito
 * @param {string} data.referencias
 * @param {Object} data.totales - { subtotal, descuentoGlobalMonto, montoNeto, iva, total }
 * @param {string} data.codigoInterno
 */
export const generateDtePreview = async (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;

    const emisor = data.emisor || {};
    const receptor = data.receptor || {};
    const totales = data.totales || {};
    const detalle = Array.isArray(data.detalle) ? data.detalle : [];
    const tipoDte = data.tipoDte;

    // Marca de agua de borrador (discreta, detrás del contenido)
    doc.saveGraphicsState?.();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(72);
    doc.setTextColor(...WATERMARK);
    doc.text('BORRADOR', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 35 });
    doc.restoreGraphicsState?.();

    // --- Header: logo + identidad del documento ---
    const logoPath = '/nativecode-logo.png';
    let logoLoaded = false;
    let logoBottom = marginX + 8;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload = () => {
                const logoWidth = 26;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(img, 'PNG', marginX, 16, logoWidth, logoHeight);
                logoBottom = 16 + logoHeight;
                logoLoaded = true;
                resolve();
            };
            img.onerror = reject;
            img.src = logoPath;
        });
    } catch {
        // Continúa sin logo
    }

    if (!logoLoaded) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text('NATIVE CODE', marginX, 24);
        logoBottom = 28;
    }

    const docTitle = tipoDte === 33 ? 'Factura Electrónica' : 'Boleta Electrónica';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(docTitle, pageWidth - marginX, 22, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`N° S/F  ·  Tipo ${tipoDte}`, pageWidth - marginX, 28, { align: 'right' });
    const fechaEmision = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(fechaEmision, pageWidth - marginX, 33, { align: 'right' });

    const headerBottom = Math.max(logoBottom, 36);
    line(doc, marginX, headerBottom + 4, pageWidth - marginX);

    // --- Nota de borrador (texto simple, sin bloques de color) ---
    let y = headerBottom + 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Documento no timbrado por el SII — sin valor tributario. Pendiente de folio (CAF).', marginX, y);

    // --- Emisor / Receptor en dos columnas ---
    y += 10;
    const colWidth = (pageWidth - marginX * 2 - 10) / 2;
    const col2X = marginX + colWidth + 10;

    label(doc, 'Emisor', marginX, y);
    label(doc, 'Receptor', col2X, y);

    const buildLines = (obj) => {
        const lines = [];
        if (obj.razonSocial) lines.push({ text: obj.razonSocial, bold: true });
        if (obj.rut) lines.push({ text: `RUT ${obj.rut}` });
        if (obj.giro) lines.push({ text: obj.giro });
        const dirComuna = [obj.direccion, obj.comuna].filter(Boolean).join(', ');
        if (dirComuna) lines.push({ text: dirComuna });
        if (obj.contacto) lines.push({ text: obj.contacto });
        return lines;
    };

    const emisorLines = buildLines({
        razonSocial: emisor.emisor_razon_social,
        rut: emisor.emisor_rut,
        giro: emisor.emisor_giro,
        direccion: emisor.emisor_direccion,
        comuna: emisor.emisor_comuna
    });
    const receptorLines = buildLines({
        razonSocial: receptor.nombre,
        rut: receptor.rut,
        giro: receptor.giro,
        direccion: receptor.direccion,
        comuna: receptor.comuna,
        contacto: [receptor.email, receptor.telefono].filter(Boolean).join('  ·  ') || null
    });

    const writeColumn = (lines, x, startY) => {
        let cy = startY;
        lines.forEach(({ text, bold }) => {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setFontSize(bold ? 10.5 : 9);
            doc.setTextColor(...INK);
            cy += bold ? 5.5 : 4.8;
            doc.text(text, x, cy);
        });
        return cy;
    };

    const emisorBottom = writeColumn(emisorLines, marginX, y);
    const receptorBottom = writeColumn(receptorLines, col2X, y);
    y = Math.max(emisorBottom, receptorBottom) + 6;

    line(doc, marginX, y, pageWidth - marginX);
    y += 8;

    // --- Detalle ---
    const detalleRows = detalle.map((l) => {
        const cantidad = safeNumber(l.cantidad);
        const precioUnitario = safeNumber(l.precioUnitario);
        const descuentoPct = safeNumber(l.descuentoPct);
        const subtotal = Math.round(cantidad * precioUnitario * (1 - descuentoPct / 100));
        return [
            l.nombre || '—',
            l.descripcion || '',
            String(cantidad),
            formatCurrency(precioUnitario),
            descuentoPct ? `${descuentoPct}%` : '—',
            formatCurrency(subtotal)
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['Producto / Servicio', 'Descripción', 'Cant.', 'P. Unit.', 'Desc.', 'Total']],
        body: detalleRows,
        theme: 'grid',
        styles: { font: 'helvetica', textColor: INK, fontSize: 9, lineColor: HAIRLINE, lineWidth: 0.2, cellPadding: 2.5 },
        headStyles: { textColor: MUTED, fillColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, lineColor: INK, lineWidth: 0.3 },
        columnStyles: {
            0: { cellWidth: 46 },
            1: { cellWidth: 48 },
            2: { cellWidth: 16, halign: 'right' },
            3: { cellWidth: 26, halign: 'right' },
            4: { cellWidth: 16, halign: 'right' },
            5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: marginX, right: marginX },
    });

    let nextY = (doc.lastAutoTable?.finalY || y + 20) + 2;

    if (nextY > pageHeight - 70) {
        doc.addPage();
        nextY = 24;
    }

    // --- Forma de pago / Medio de pago / Vencimiento / Referencias ---
    nextY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const pagoParts = [`Forma de pago: ${data.formaPago || '—'}`];
    if (data.medioPago) pagoParts.push(`Medio de pago: ${data.medioPago}`);
    doc.text(pagoParts.join('   ·   '), marginX, nextY);
    if (data.fechaVencimiento) {
        nextY += 5;
        const fchVenc = new Date(`${data.fechaVencimiento}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Fecha de vencimiento: ${fchVenc}`, marginX, nextY);
    }
    if (data.referencias) {
        nextY += 5;
        doc.text(`Referencias: ${data.referencias}`, marginX, nextY);
    }

    // --- Totales (columna derecha) ---
    let totY = nextY + 10;
    const totalsX = pageWidth - marginX - 62;
    const rowsTot = [
        ['Subtotal', totales.subtotal],
        ['Descuento global', totales.descuentoGlobalMonto],
        ['Monto neto', totales.montoNeto],
        [tipoDte === 33 || totales.iva > 0 ? 'IVA (19%)' : 'IVA', totales.iva],
    ];
    rowsTot.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text(lbl, totalsX, totY);
        doc.setTextColor(...INK);
        doc.text(formatCurrency(val), pageWidth - marginX, totY, { align: 'right' });
        totY += 5.5;
    });

    line(doc, totalsX, totY, pageWidth - marginX);
    totY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text('Total', totalsX, totY);
    doc.text(formatCurrency(totales.total), pageWidth - marginX, totY, { align: 'right' });

    // --- Acuse de Recibo (Ley 19.983) — solo Factura (33) a Crédito ---
    if (tipoDte === 33 && data.formaPago === 'Crédito') {
        let acuseY = totY + 16;
        if (acuseY > pageHeight - 65) {
            doc.addPage();
            acuseY = 30;
        }
        line(doc, marginX, acuseY - 6, pageWidth - marginX);
        label(doc, 'Acuse de Recibo', marginX, acuseY);
        acuseY += 8;

        const fieldWidth = (pageWidth - marginX * 2 - 10) / 2;
        const drawField = (text, x, yy) => {
            doc.setDrawColor(...HAIRLINE);
            doc.setLineWidth(0.25);
            doc.line(x, yy, x + fieldWidth, yy);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...MUTED);
            doc.text(text, x, yy + 4);
        };
        drawField('Nombre', marginX, acuseY);
        drawField('RUT', marginX + fieldWidth + 10, acuseY);
        drawField('Recinto', marginX, acuseY + 14);
        drawField('Fecha', marginX + fieldWidth + 10, acuseY + 14);
        drawField('Firma', marginX, acuseY + 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(...FAINT);
        const acuseText = 'El acuse de recibo que se declara en este acto, de acuerdo a lo dispuesto en la letra b) del Art. 4°, y la letra c) del Art. 5° de la ley 19.983, acredita que la entrega de mercaderías o servicio(s) prestado(s) ha(n) sido recibido(s).';
        doc.text(doc.splitTextToSize(acuseText, pageWidth - marginX * 2), marginX, acuseY + 40);
    }

    // --- Footer ---
    const generatedAt = new Date().toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const footerY = pageHeight - 14;
    line(doc, marginX, footerY - 6, pageWidth - marginX);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    doc.text(`Generado ${generatedAt}`, marginX, footerY);
    doc.text('Documento de prueba — no válido para efectos tributarios', pageWidth - marginX, footerY, { align: 'right' });

    const fileName = `Borrador-DTE-${data.codigoInterno || 'proyecto'}.pdf`;
    doc.save(fileName);
    return fileName;
};
