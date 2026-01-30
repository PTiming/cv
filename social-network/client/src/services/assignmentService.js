import api from './api';

// Assignments
export const getAssignments = (params) => api.get('/assignments', { params });
export const getAssignment = (id) => api.get(`/assignments/${id}`);
export const createAssignment = (data) => api.post('/assignments', data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const getAssignmentsByCourse = (courseId, params) => api.get(`/assignments/course/${courseId}`, { params });

// Tasks
export const addTask = (assignmentId, data) => api.post(`/assignments/${assignmentId}/tasks`, data);
export const updateTask = (assignmentId, taskId, data) => api.put(`/assignments/${assignmentId}/tasks/${taskId}`, data);

// Collaborators
export const addCollaborator = (assignmentId, userId, role) => api.post(`/assignments/${assignmentId}/collaborators`, { userId, role });
export const removeCollaborator = (assignmentId, userId) => api.delete(`/assignments/${assignmentId}/collaborators/${userId}`);

// Discussions
export const addDiscussion = (assignmentId, content, attachments) => api.post(`/assignments/${assignmentId}/discussions`, { content, attachments });

// Files
export const uploadAssignmentFile = (assignmentId, url, filename) => api.post(`/assignments/${assignmentId}/files`, { url, filename });
