import apiClient from './apiClient';

export const getActualizaciones = () => apiClient.get('/api/soporte/actualizaciones');
export const enviarActualizacion = (data) => apiClient.post('/api/soporte/actualizaciones/enviar', data);
