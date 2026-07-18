import apiClient from './apiClient';

/**
 * dteService - Emisión real de Documentos Tributarios Electrónicos (Fase 2).
 * Distinto de dtePdfGenerator.js (que solo genera la vista previa/borrador en el navegador):
 * estas funciones le pegan al backend, que firma y envía el documento real al SII.
 */

/** Indica si hay CAF cargado por tipo de documento — usar para habilitar/deshabilitar "Emitir DTE". */
export const getEstadoCaf = async () => {
    try {
        return await apiClient.get('/api/dte/estado');
    } catch (error) {
        console.error('Error obteniendo estado del CAF:', error);
        return { boleta39: false, factura33: false, ambiente: 'certificacion' };
    }
};

/**
 * Emite un DTE real para un proyecto. El backend arma el emisor/receptor desde la config y el
 * proyecto — solo hace falta mandar el detalle si se quiere distinto al default (nombre del
 * proyecto + monto acordado).
 */
export const emitirDte = async (idProyecto, { detalle, tipoDte, fechaVencimiento, idPago } = {}) => {
    try {
        const data = await apiClient.post(`/api/dte/emitir/${idProyecto}`, {
            detalle, tipoDte, fechaVencimiento, id_pago: idPago,
        });
        return data;
    } catch (error) {
        console.error(`Error emitiendo DTE para proyecto ${idProyecto}:`, error);
        return { ok: false, errorMensaje: error.message };
    }
};

/** Historial de documentos emitidos para un proyecto. */
export const getHistorial = async (idProyecto) => {
    try {
        const data = await apiClient.get(`/api/dte/proyecto/${idProyecto}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error obteniendo historial DTE del proyecto ${idProyecto}:`, error);
        return [];
    }
};

/** Último documento emitido para un proyecto — para "usar los mismos datos que el último". */
export const getUltimoDocumento = async (idProyecto) => {
    try {
        return await apiClient.get(`/api/dte/proyecto/${idProyecto}/ultimo`);
    } catch (error) {
        console.error(`Error obteniendo último documento del proyecto ${idProyecto}:`, error);
        return null;
    }
};
