import apiClient from './apiClient';

const BASE = '/api/calendario';

export const getEventos   = (params) => apiClient.get(`${BASE}?${new URLSearchParams(params)}`);
export const getEvento    = (id)     => apiClient.get(`${BASE}/${id}`);
export const createEvento = (data)   => apiClient.post(BASE, data);
export const updateEvento = (id, d)  => apiClient.put(`${BASE}/${id}`, d);
export const deleteEvento = (id)     => apiClient.delete(`${BASE}/${id}`);
