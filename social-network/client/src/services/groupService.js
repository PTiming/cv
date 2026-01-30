import api from './api';

// Groups
export const getGroups = (params) => api.get('/groups', { params });
export const getMyGroups = (params) => api.get('/groups/my-groups', { params });
export const getGroup = (id) => api.get(`/groups/${id}`);
export const createGroup = (data) => api.post('/groups', data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);
export const joinGroup = (id) => api.post(`/groups/${id}/join`);
export const leaveGroup = (id) => api.post(`/groups/${id}/leave`);
export const approveJoinRequest = (groupId, userId) => api.post(`/groups/${groupId}/approve/${userId}`);
export const rejectJoinRequest = (groupId, userId) => api.post(`/groups/${groupId}/reject/${userId}`);
export const getGroupPosts = (id, params) => api.get(`/groups/${id}/posts`, { params });
export const createGroupPost = (id, data) => api.post(`/groups/${id}/posts`, data);
export const getStudyGroupsByCourse = (courseId) => api.get(`/groups/course/${courseId}`);
