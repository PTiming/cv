import api from './api';

// Resources
export const getResources = (params) => api.get('/resources', { params });
export const getMyResources = (params) => api.get('/resources/my-resources', { params });
export const getSavedResources = (params) => api.get('/resources/saved', { params });
export const getResource = (id) => api.get(`/resources/${id}`);
export const createResource = (data) => api.post('/resources', data);
export const updateResource = (id, data) => api.put(`/resources/${id}`, data);
export const deleteResource = (id) => api.delete(`/resources/${id}`);
export const likeResource = (id) => api.post(`/resources/${id}/like`);
export const unlikeResource = (id) => api.delete(`/resources/${id}/like`);
export const saveResource = (id) => api.post(`/resources/${id}/save`);
export const unsaveResource = (id) => api.delete(`/resources/${id}/save`);
export const addResourceComment = (id, content) => api.post(`/resources/${id}/comments`, { content });
export const downloadResource = (id) => api.post(`/resources/${id}/download`);
export const getResourcesByCourse = (courseId, params) => api.get(`/resources/course/${courseId}`, { params });
