import apiClient from './apiClient';

export const getInvestments = async () => {
    try {
        const data = await apiClient.get('/api/inversiones');
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
        console.error(`Error eliminando inversión ${id}:`, error);
        return false;
    }
};
