import apiClient from './apiClient';

const BASE = '/api/admin';

export const listServers    = ()          => apiClient.get(`${BASE}/servers`);
export const getStats       = (id)        => apiClient.get(`${BASE}/servers/${id}/stats`);
export const getLogs        = (id, params) => apiClient.get(`${BASE}/servers/${id}/logs?${new URLSearchParams(params)}`);
