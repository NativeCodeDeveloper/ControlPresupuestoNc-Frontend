import apiClient from './apiClient';

const BASE = '/api/synapse';

// ── Estados ───────────────────────────────────────────────────────────────────
export const getEstados = () => apiClient.get(`${BASE}/estados`);
export const createEstado = (data) => apiClient.post(`${BASE}/estados`, data);
export const updateEstado = (id, data) => apiClient.put(`${BASE}/estados/${id}`, data);
export const deleteEstado = (id) => apiClient.delete(`${BASE}/estados/${id}`);
export const reorderEstados = (ids) => apiClient.patch(`${BASE}/estados/reorder`, { ids });

// ── Etiquetas ─────────────────────────────────────────────────────────────────
export const getEtiquetas = () => apiClient.get(`${BASE}/etiquetas`);
export const createEtiqueta = (data) => apiClient.post(`${BASE}/etiquetas`, data);
export const updateEtiqueta = (id, data) => apiClient.put(`${BASE}/etiquetas/${id}`, data);
export const deleteEtiqueta = (id) => apiClient.delete(`${BASE}/etiquetas/${id}`);

// ── Tareas ────────────────────────────────────────────────────────────────────
export const getTareas = (params = {}) => {
    const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return apiClient.get(`${BASE}/tareas${qs ? `?${qs}` : ''}`);
};
export const getTareaById = (id) => apiClient.get(`${BASE}/tareas/${id}`);
export const createTarea = (data) => apiClient.post(`${BASE}/tareas`, data);
export const updateTarea = (id, data) => apiClient.put(`${BASE}/tareas/${id}`, data);
export const updateTareaEstado = (id, id_estado) => apiClient.patch(`${BASE}/tareas/${id}/estado`, { id_estado });
export const deleteTarea = (id) => apiClient.delete(`${BASE}/tareas/${id}`);

// ── Comentarios ───────────────────────────────────────────────────────────────
export const getComentarios = (id) => apiClient.get(`${BASE}/tareas/${id}/comentarios`);
export const createComentario = (id, contenido) => apiClient.post(`${BASE}/tareas/${id}/comentarios`, { contenido });
export const deleteComentario = (id_tarea, id_comentario) => apiClient.delete(`${BASE}/tareas/${id_tarea}/comentarios/${id_comentario}`);

// ── Meta ──────────────────────────────────────────────────────────────────────
export const getMetaProyectos = () => apiClient.get(`${BASE}/meta/proyectos`);
export const getMetaSocios = () => apiClient.get(`${BASE}/meta/socios`);
