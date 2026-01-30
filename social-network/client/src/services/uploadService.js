import api from './api';

/**
 * Upload a single image
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Upload result
 */
export const uploadImage = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('image', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  const response = await api.post('/upload/image', formData, config);
  return response.data;
};

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Upload result
 */
export const uploadImages = async (files, onProgress = null) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  const response = await api.post('/upload/images', formData, config);
  return response.data;
};

/**
 * Upload a document
 * @param {File} file - The document file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Upload result
 */
export const uploadDocument = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('document', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  const response = await api.post('/upload/document', formData, config);
  return response.data;
};

/**
 * Upload a video
 * @param {File} file - The video file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Upload result
 */
export const uploadVideo = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('video', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  const response = await api.post('/upload/video', formData, config);
  return response.data;
};

/**
 * Upload a profile picture
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} - Upload result
 */
export const uploadProfilePicture = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  const response = await api.post('/upload/profile-picture', formData, config);
  return response.data;
};

/**
 * Delete an uploaded file
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<object>} - Deletion result
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  const response = await api.delete(`/upload/${encodeURIComponent(publicId)}?resourceType=${resourceType}`);
  return response.data;
};

/**
 * Get file type from mime type
 * @param {string} mimeType - The mime type
 * @returns {string} - File type category
 */
export const getFileTypeCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  return 'file';
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result { valid: boolean, error?: string }
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = null,
    allowedExtensions = null
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${formatFileSize(maxSize)})`
    };
  }

  // Check mime type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  // Check extension
  if (allowedExtensions) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`
      };
    }
  }

  return { valid: true };
};

export default {
  uploadImage,
  uploadImages,
  uploadDocument,
  uploadVideo,
  uploadProfilePicture,
  deleteFile,
  getFileTypeCategory,
  formatFileSize,
  validateFile
};
