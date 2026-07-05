import apiClient from './apiClient';

export const getClientes           = ()        => apiClient.get('/api/clientes');
export const getClienteProyectos   = (nombre)  => apiClient.get(`/api/clientes/${encodeURIComponent(nombre)}/proyectos`);

// Bóveda
export const getBovedas            = ()        => apiClient.get('/api/clientes/boveda');
export const getBoveda             = (id)      => apiClient.get(`/api/clientes/boveda/${id}`);
export const getBovedaByProyecto   = (idProy)  => apiClient.get(`/api/clientes/boveda/proyecto/${idProy}`);
export const createBoveda          = (data)    => apiClient.post('/api/clientes/boveda', data);
export const updateBoveda          = (id, d)   => apiClient.put(`/api/clientes/boveda/${id}`, d);

// Env vars
export const getEnvVars            = (id)      => apiClient.get(`/api/clientes/boveda/${id}/env`);
export const createEnvVar          = (id, d)   => apiClient.post(`/api/clientes/boveda/${id}/env`, d);
export const updateEnvVar          = (id, eid, d) => apiClient.put(`/api/clientes/boveda/${id}/env/${eid}`, d);
export const deleteEnvVar          = (id, eid) => apiClient.delete(`/api/clientes/boveda/${id}/env/${eid}`);

// Accesos
export const getAccesos            = (id)      => apiClient.get(`/api/clientes/boveda/${id}/accesos`);
export const createAcceso          = (id, d)   => apiClient.post(`/api/clientes/boveda/${id}/accesos`, d);
export const updateAcceso          = (id, aid, d) => apiClient.put(`/api/clientes/boveda/${id}/accesos/${aid}`, d);
export const deleteAcceso          = (id, aid) => apiClient.delete(`/api/clientes/boveda/${id}/accesos/${aid}`);
