import apiClient from './apiClient';

export const getFinancialSummary = async (month = null, year = null) => {
    try {
        const params = new URLSearchParams();
        if (month !== null && month !== undefined) params.append('mes', month);
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
