const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');

// Configure Cloudinary storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'social-network/uploads';
    let resourceType = 'auto';
    let transformation = [];

    // Determine folder and settings based on file type
    if (file.mimetype.startsWith('image/')) {
      folder = 'social-network/images';
      resourceType = 'image';
      transformation = [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ];
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'social-network/videos';
      resourceType = 'video';
    } else {
      folder = 'social-network/documents';
      resourceType = 'raw';
    }

    // Add user-specific folder if available
    if (req.user && req.user.id) {
      folder += `/${req.user.id}`;
    }

    return {
      folder,
      resource_type: resourceType,
      transformation: transformation.length > 0 ? transformation : undefined,
      public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip']
    };
  }
});

// Local storage fallback (for development without Cloudinary)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ];

  const allAllowed = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Determine storage based on environment
const getStorage = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    return cloudinaryStorage;
  }
  console.warn('Cloudinary not configured, using local storage');
  return localStorage;
};

// Create multer upload instances
const upload = multer({
  storage: getStorage(),
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE, 10) || 10) * 1024 * 1024 // Default 10MB
  }
});

// Specific upload configurations
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Profile picture upload with specific settings
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `social-network/profiles/${req.user?.id || 'anonymous'}`,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    public_id: `avatar-${Date.now()}`
  })
});

const uploadProfilePicture = multer({
  storage: process.env.CLOUDINARY_CLOUD_NAME ? profilePictureStorage : localStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for profile pictures
  }
}).single('profilePicture');

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE || 10}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files uploaded'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfilePicture,
  handleUploadError
};
