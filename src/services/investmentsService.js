import apiClient from './apiClient';

const isNotFoundDelete = (error) => Number(error?.status) === 404;
const toQueryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.append(key, String(value));
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

export const getInvestments = async (params = {}) => {
    try {
        const data = await apiClient.get(`/api/inversiones${toQueryString(params)}`);
        return data || [];
    } catch (error) {
        console.error('Error obteniendo inversiones:', error);
        return [];
    }
};

export const addInvestment = async (payload) => {
    try {
        const data = await apiClient.post('/api/inversiones', payload);
        return data || null;
    } catch (error) {
        console.error('Error registrando movimiento de inversión:', error);
        return { ok: false, message: error?.message || 'Error registrando inversión' };
    }
};

export const deleteInvestment = async (id) => {
    try {
        const result = await apiClient.delete(`/api/inversiones/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        if (isNotFoundDelete(error)) return true;
        console.error(`Error eliminando inversión ${id}:`, error);
        return false;
    }
};
