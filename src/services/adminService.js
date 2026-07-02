import apiClient from './apiClient';

const BASE = '/api/admin';

export const listServers         = ()            => apiClient.get(`${BASE}/servers`);
export const createServer        = (data)        => apiClient.post(`${BASE}/servers`, data);
export const deleteServer        = (id)          => apiClient.delete(`${BASE}/servers/${id}`);
export const getStats            = (id)          => apiClient.get(`${BASE}/servers/${id}/stats`);
export const getLogs             = (id, params)  => apiClient.get(`${BASE}/servers/${id}/logs?${new URLSearchParams(params)}`);
export const execCommand         = (id, command) => apiClient.post(`${BASE}/servers/${id}/exec`, { command });
export const listServerProcesses = (id)          => apiClient.get(`${BASE}/servers/${id}/processes`);

export const listClients         = ()             => apiClient.get(`${BASE}/clients`);
export const updateClientProcess = (id, data)     => apiClient.patch(`${BASE}/server-process/${id}`, data);
