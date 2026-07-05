import apiClient from './apiClient';

export const getEstados      = ()         => apiClient.get('/api/soporte/estados');
export const createEstado    = (data)     => apiClient.post('/api/soporte/estados', data);
export const deleteEstado    = (id)       => apiClient.delete(`/api/soporte/estados/${id}`);
export const getTickets    = (filtros = {}) => {
    const q = new URLSearchParams();
    if (filtros.estado)      q.append('estado',      filtros.estado);
    if (filtros.prioridad)   q.append('prioridad',   filtros.prioridad);
    if (filtros.responsable) q.append('responsable', filtros.responsable);
    const qs = q.toString();
    return apiClient.get(`/api/soporte${qs ? `?${qs}` : ''}`);
};
export const getTicket     = (id)       => apiClient.get(`/api/soporte/${id}`);
export const createTicket  = (data)     => apiClient.post('/api/soporte', data);
export const updateTicket  = (id, data) => apiClient.put(`/api/soporte/${id}`, data);
export const deleteTicket  = (id)       => apiClient.delete(`/api/soporte/${id}`);

export const getActividad  = (id)       => apiClient.get(`/api/soporte/${id}/actividad`);
export const addComentario = (id, data) => apiClient.post(`/api/soporte/${id}/actividad/comentario`, data);

export const previewEmail  = (id, tipo) => apiClient.get(`/api/soporte/${id}/email/preview?tipo=${tipo}`);
export const enviarEmail   = (id, data) => apiClient.post(`/api/soporte/${id}/email/enviar`, data);
