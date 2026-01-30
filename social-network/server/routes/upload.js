const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadProfilePicture, handleUploadError } = require('../middleware/upload');

// Helper to get file URL
const getFileUrl = (req, file) => {
  const relativePath = file.path.replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/${relativePath}`;
};

// @route   POST /api/upload/image
// @desc    Upload a single image
// @access  Private
router.post('/image', auth, uploadSingle('image'), handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const fileInfo = {
    url: getFileUrl(req, req.file),
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path
  };

  res.json({
    message: 'Image uploaded successfully',
    file: fileInfo
  });
});

// @route   POST /api/upload/images
// @desc    Upload multiple images (max 10)
// @access  Private
router.post('/images', auth, uploadMultiple('images', 10), handleUploadError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files provided' });
  }

  const files = req.files.map(file => ({
    url: getFileUrl(req, file),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path
  }));

  res.json({
    message: `${files.length} images uploaded successfully`,
    files
  });
});

// @route   POST /api/upload/document
// @desc    Upload a document
// @access  Private
router.post('/document', auth, uploadSingle('document'), handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No document file provided' });
  }

  const fileInfo = {
    url: getFileUrl(req, req.file),
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path
  };

  res.json({
    message: 'Document uploaded successfully',
    file: fileInfo
  });
});

// @route   POST /api/upload/video
// @desc    Upload a video
// @access  Private
router.post('/video', auth, uploadSingle('video'), handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const fileInfo = {
    url: getFileUrl(req, req.file),
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path
  };

  res.json({
    message: 'Video uploaded successfully',
    file: fileInfo
  });
});

// @route   POST /api/upload/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile-picture', auth, (req, res) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No profile picture provided' });
    }

    const fileInfo = {
      url: getFileUrl(req, req.file),
      filename: req.file.filename,
      path: req.file.path
    };

    res.json({
      message: 'Profile picture uploaded successfully',
      file: fileInfo
    });
  });
});

// @route   DELETE /api/upload/:filename
// @desc    Delete an uploaded file
// @access  Private
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { folder = 'uploads' } = req.query;
    
    // Construct the file path - only allow deleting from uploads directory
    const uploadBase = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadBase, folder, req.user.id.toString(), filename);
    
    // Security check - ensure the path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(uploadBase);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(resolvedPath);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error while deleting file' });
  }
});

module.exports = router;
