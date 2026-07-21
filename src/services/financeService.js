import apiClient from './apiClient';

export const getFinancialSummary = async (month = null, year = null) => {
    try {
        const params = new URLSearchParams();
        if (month !== null && month !== undefined) params.append('mes', Number(month) + 1);
        if (year !== null && year !== undefined) params.append('year', year);

        const query = params.toString();
        const url = query ? `/api/finanzas/resumen?${query}` : '/api/finanzas/resumen';
        const data = await apiClient.get(url);
        return data || null;
    } catch (error) {
        console.error('Error obteniendo resumen financiero:', error);
        return null;
    }
};

export const getFlujoCaja = async (year = null) => {
    try {
        const params = new URLSearchParams();
        if (year !== null && year !== undefined) params.append('year', year);
        const query = params.toString();
        const url = query ? `/api/finanzas/flujo-caja?${query}` : '/api/finanzas/flujo-caja';
        const data = await apiClient.get(url);
        return data || null;
    } catch (error) {
        console.error('Error obteniendo flujo de caja:', error);
        return null;
    }
};

export const getDueAlerts = async (days = 7) => {
    try {
        const data = await apiClient.get(`/api/finanzas/vencimientos?dias=${days}`);
        return data || { items: [] };
    } catch (error) {
        console.error('Error obteniendo alertas de vencimiento:', error);
        return { items: [] };
    }
};

export const getF29 = async (month = null, year = null) => {
    try {
        const params = new URLSearchParams();
        if (month !== null && month !== undefined) params.append('mes', Number(month) + 1);
        if (year !== null && year !== undefined) params.append('year', year);
        const query = params.toString();
        const url = query ? `/api/finanzas/f29?${query}` : '/api/finanzas/f29';
        const data = await apiClient.get(url);
        return data || null;
    } catch (error) {
        console.error('Error obteniendo F29:', error);
        return null;
    }
};

export const getF29Historial = async (meses = 12) => {
    try {
        const data = await apiClient.get(`/api/finanzas/f29/historial?meses=${meses}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error obteniendo historial F29:', error);
        return [];
    }
};

// mes: 1-12 (no 0-indexado, a diferencia de getF29)
export const marcarF29Pagado = (mes, anio, extra = {}) =>
    apiClient.post('/api/finanzas/f29/marcar-pagado', { mes, anio, ...extra });

export const desmarcarF29Pagado = (anio, mes) =>
    apiClient.delete(`/api/finanzas/f29/marcar-pagado/${anio}/${mes}`);
