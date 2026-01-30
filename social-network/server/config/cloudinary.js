const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file or base64 string
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload result
 */
const uploadFile = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'social-network',
    resource_type: 'auto',
    ...options
  };
  
  return cloudinary.uploader.upload(filePath, defaultOptions);
};

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Path to the image or base64 string
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload result
 */
const uploadImage = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'social-network/images',
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    ...options
  };
  
  return cloudinary.uploader.upload(filePath, defaultOptions);
};

/**
 * Upload a profile picture to Cloudinary
 * @param {string} filePath - Path to the image or base64 string
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<object>} - Upload result
 */
const uploadProfilePicture = async (filePath, userId) => {
  return cloudinary.uploader.upload(filePath, {
    folder: `social-network/profiles/${userId}`,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
};

/**
 * Upload a video to Cloudinary
 * @param {string} filePath - Path to the video
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload result
 */
const uploadVideo = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'social-network/videos',
    resource_type: 'video',
    eager: [
      { streaming_profile: 'hd', format: 'm3u8' },
      { format: 'mp4', transformation: [{ quality: 'auto' }] }
    ],
    eager_async: true,
    ...options
  };
  
  return cloudinary.uploader.upload(filePath, defaultOptions);
};

/**
 * Upload a document to Cloudinary
 * @param {string} filePath - Path to the document
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload result
 */
const uploadDocument = async (filePath, options = {}) => {
  const defaultOptions = {
    folder: 'social-network/documents',
    resource_type: 'raw',
    ...options
  };
  
  return cloudinary.uploader.upload(filePath, defaultOptions);
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<object>} - Deletion result
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Get a signed URL for a file
 * @param {string} publicId - Public ID of the file
 * @param {object} options - URL options
 * @returns {string} - Signed URL
 */
const getSignedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    type: 'authenticated',
    sign_url: true,
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
  cloudinary,
  uploadFile,
  uploadImage,
  uploadProfilePicture,
  uploadVideo,
  uploadDocument,
  deleteFile,
  getSignedUrl
};
