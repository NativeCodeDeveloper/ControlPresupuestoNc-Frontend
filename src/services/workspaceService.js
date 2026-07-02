import apiClient from './apiClient';

const BASE = '/api/workspace';

export const getIniciativas  = ()        => apiClient.get(BASE).then(r => r.data);
export const getIniciativa   = (id)      => apiClient.get(`${BASE}/${id}`).then(r => r.data);
export const createIniciativa = (data)   => apiClient.post(BASE, data).then(r => r.data);
export const updateIniciativa = (id, d)  => apiClient.put(`${BASE}/${id}`, d).then(r => r.data);
export const deleteIniciativa = (id)     => apiClient.delete(`${BASE}/${id}`).then(r => r.data);
