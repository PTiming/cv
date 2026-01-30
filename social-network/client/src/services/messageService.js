import api from './api';

// Conversations
export const getConversations = (params) => api.get('/messages/conversations', { params });
export const getConversation = (id) => api.get(`/messages/conversations/${id}`);
export const createConversation = (data) => api.post('/messages/conversations', data);
export const updateConversation = (id, data) => api.put(`/messages/conversations/${id}`, data);

// Group chat participants
export const addParticipant = (conversationId, userId) => api.post(`/messages/conversations/${conversationId}/participants`, { userId });
export const removeParticipant = (conversationId, userId) => api.delete(`/messages/conversations/${conversationId}/participants/${userId}`);
export const leaveConversation = (id) => api.post(`/messages/conversations/${id}/leave`);

// Messages
export const getMessages = (conversationId, params) => api.get(`/messages/conversations/${conversationId}/messages`, { params });
export const sendMessage = (conversationId, data) => api.post(`/messages/conversations/${conversationId}/messages`, data);
export const markAsRead = (conversationId) => api.post(`/messages/conversations/${conversationId}/read`);
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);

// Utility
export const getUnreadCount = () => api.get('/messages/unread-count');
export const searchUsers = (query, limit = 10) => api.get('/messages/search-users', { params: { query, limit } });
