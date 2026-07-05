import apiClient from './apiClient';

export const getEstados            = ()      => apiClient.get('/api/soporte/actualizaciones/estados');
export const createEstado          = (data)  => apiClient.post('/api/soporte/actualizaciones/estados', data);
export const deleteEstado          = (id)    => apiClient.delete(`/api/soporte/actualizaciones/estados/${id}`);
export const getActualizaciones    = ()      => apiClient.get('/api/soporte/actualizaciones');
export const getActualizacion      = (id)    => apiClient.get(`/api/soporte/actualizaciones/${id}`);
export const createActualizacion   = (data)  => apiClient.post('/api/soporte/actualizaciones', data);
export const updateActualizacion   = (id, d) => apiClient.put(`/api/soporte/actualizaciones/${id}`, d);
export const deleteActualizacion   = (id)    => apiClient.delete(`/api/soporte/actualizaciones/${id}`);
export const notificar             = (id)    => apiClient.post(`/api/soporte/actualizaciones/${id}/notificar`);
export const enviarActualizacion   = (data)  => apiClient.post('/api/soporte/actualizaciones/enviar', data);
