import apiClient from './apiClient';

export const getEstados          = ()     => apiClient.get('/api/soporte/actualizaciones/estados');
export const createEstado        = (data) => apiClient.post('/api/soporte/actualizaciones/estados', data);
export const deleteEstado        = (id)   => apiClient.delete(`/api/soporte/actualizaciones/estados/${id}`);
export const getActualizaciones  = ()     => apiClient.get('/api/soporte/actualizaciones');
export const enviarActualizacion = (data) => apiClient.post('/api/soporte/actualizaciones/enviar', data);
