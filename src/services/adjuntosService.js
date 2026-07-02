import apiClient, { fetchWithAuth } from './apiClient';

const BASE = '/api/adjuntos';

export const getAdjuntos = (entidad, id) =>
    apiClient.get(`${BASE}/${entidad}/${id}`);

export const uploadAdjunto = async (entidad, id_entidad, file) => {
    const form = new FormData();
    form.append('file', file);
    form.append('entidad', entidad);
    form.append('id_entidad', String(id_entidad));
    const res = await fetchWithAuth(BASE, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Error al subir archivo: ${res.status}`);
    return res.json();
};

export const deleteAdjunto = (id) =>
    apiClient.delete(`${BASE}/${id}`);

export const downloadAdjunto = async (adj) => {
    const res = await fetchWithAuth(`${BASE}/file/${adj.id_adjunto}`);
    if (!res.ok) throw new Error('No se pudo descargar el archivo');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = adj.nombre_original;
    a.click();
    URL.revokeObjectURL(url);
};
