import api from './api';

const postService = {
  // Get news feed
  getFeed: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get explore posts
  getExplorePosts: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/explore?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Create post
  createPost: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  // Update post
  updatePost: async (postId, postData) => {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  // Like post
  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Unlike post
  unlikePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  // Share post
  sharePost: async (postId, content = '') => {
    const response = await api.post(`/posts/${postId}/share`, { content });
    return response.data;
  },

  // Get comments for a post
  getComments: async (postId, page = 1, limit = 20) => {
    const response = await api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Add comment
  addComment: async (postId, content, parentCommentId = null) => {
    const response = await api.post(`/posts/${postId}/comments`, {
      content,
      parentCommentId
    });
    return response.data;
  },

  // Get course posts
  getCoursePosts: async (courseId, page = 1, limit = 10) => {
    const response = await api.get(`/posts/course/${courseId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Search posts
  searchPosts: async (query, tag = '', page = 1, limit = 10) => {
    const params = new URLSearchParams({ page, limit });
    if (query) params.append('q', query);
    if (tag) params.append('tag', tag);
    const response = await api.get(`/posts/search?${params}`);
    return response.data;
  }
};

export default postService;
