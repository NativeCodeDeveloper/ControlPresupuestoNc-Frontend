import apiClient from './apiClient';

// Estados
export const getEstados      = ()         => apiClient.get('/api/qa/estados');
export const createEstado    = (data)     => apiClient.post('/api/qa/estados', data);
export const deleteEstado    = (id)       => apiClient.delete(`/api/qa/estados/${id}`);
export const reorderEstados  = (ids)      => apiClient.patch('/api/qa/estados/reorder', { ids });

// Tipos de caso
export const getTipos      = ()         => apiClient.get('/api/qa/tipos');
export const createTipo    = (data)     => apiClient.post('/api/qa/tipos', data);
export const deleteTipo    = (id)       => apiClient.delete(`/api/qa/tipos/${id}`);
export const reorderTipos  = (ids)      => apiClient.patch('/api/qa/tipos/reorder', { ids });

// Prioridades
export const getPrioridades     = ()         => apiClient.get('/api/qa/prioridades');
export const createPrioridad    = (data)     => apiClient.post('/api/qa/prioridades', data);
export const deletePrioridad    = (id)       => apiClient.delete(`/api/qa/prioridades/${id}`);
export const reorderPrioridades = (ids)      => apiClient.patch('/api/qa/prioridades/reorder', { ids });

// Etiquetas
export const getEtiquetas   = ()        => apiClient.get('/api/qa/etiquetas');
export const createEtiqueta = (data)    => apiClient.post('/api/qa/etiquetas', data);
export const deleteEtiqueta = (id)      => apiClient.delete(`/api/qa/etiquetas/${id}`);

// Versiones
export const getVersiones    = ()         => apiClient.get('/api/qa/versiones');
export const getVersion      = (id)       => apiClient.get(`/api/qa/versiones/${id}`);
export const createVersion   = (data)     => apiClient.post('/api/qa/versiones', data);
export const updateVersion   = (id, data) => apiClient.put(`/api/qa/versiones/${id}`, data);
export const deleteVersion   = (id)       => apiClient.delete(`/api/qa/versiones/${id}`);

// Casos
export const getCasos      = (id_version, filtros = {}) => {
    const q = new URLSearchParams();
    if (filtros.estado)      q.append('estado',      filtros.estado);
    if (filtros.prioridad)   q.append('prioridad',   filtros.prioridad);
    if (filtros.tipo)        q.append('tipo',        filtros.tipo);
    if (filtros.responsable) q.append('responsable', filtros.responsable);
    const qs = q.toString();
    return apiClient.get(`/api/qa/versiones/${id_version}/casos${qs ? `?${qs}` : ''}`);
};
export const getCaso       = (id)       => apiClient.get(`/api/qa/casos/${id}`);
export const createCaso    = (data)     => apiClient.post('/api/qa/casos', data);
export const updateCaso    = (id, data) => apiClient.put(`/api/qa/casos/${id}`, data);
export const deleteCaso    = (id)       => apiClient.delete(`/api/qa/casos/${id}`);

// Actividad
export const getActividad  = (id)       => apiClient.get(`/api/qa/casos/${id}/actividad`);
export const addComentario = (id, data) => apiClient.post(`/api/qa/casos/${id}/actividad/comentario`, data);
