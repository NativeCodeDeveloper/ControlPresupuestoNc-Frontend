import apiClient from './apiClient';

const BASE = '/api/workspace';

export const getIniciativas   = ()       => apiClient.get(BASE);
export const getIniciativa    = (id)     => apiClient.get(`${BASE}/${id}`);
export const createIniciativa = (data)   => apiClient.post(BASE, data);
export const updateIniciativa = (id, d)  => apiClient.put(`${BASE}/${id}`, d);
export const deleteIniciativa = (id)     => apiClient.delete(`${BASE}/${id}`);
