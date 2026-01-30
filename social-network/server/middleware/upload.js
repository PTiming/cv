const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

// Base upload path
const UPLOAD_BASE = process.env.UPLOAD_PATH || './uploads';

// Create storage for different file types
const createStorage = (subFolder = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let folder = UPLOAD_BASE;
      
      // Organize by file type
      if (file.mimetype.startsWith('image/')) {
        folder = path.join(UPLOAD_BASE, 'images', subFolder);
      } else if (file.mimetype.startsWith('video/')) {
        folder = path.join(UPLOAD_BASE, 'videos', subFolder);
      } else {
        folder = path.join(UPLOAD_BASE, 'documents', subFolder);
      }
      
      // Add user folder if available
      if (req.user && req.user.id) {
        folder = path.join(folder, req.user.id.toString());
      }
      
      ensureDir(folder);
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, uniqueSuffix + '-' + safeName);
    }
  });
};

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

// Create multer upload instance
const upload = multer({
  storage: createStorage(),
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
const profilePictureUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = path.join(UPLOAD_BASE, 'profiles', req.user?.id?.toString() || 'anonymous');
      ensureDir(folder);
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
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
});

const uploadProfilePicture = profilePictureUpload.single('profilePicture');

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
