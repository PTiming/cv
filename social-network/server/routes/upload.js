const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadProfilePicture, handleUploadError } = require('../middleware/upload');
const { deleteFile } = require('../config/cloudinary');

// @route   POST /api/upload/image
// @desc    Upload a single image
// @access  Private
router.post('/image', auth, uploadSingle('image'), handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const fileInfo = {
    url: req.file.path || req.file.secure_url || req.file.url,
    publicId: req.file.filename || req.file.public_id,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
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
    url: file.path || file.secure_url || file.url,
    publicId: file.filename || file.public_id,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
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
    url: req.file.path || req.file.secure_url || req.file.url,
    publicId: req.file.filename || req.file.public_id,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
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
    url: req.file.path || req.file.secure_url || req.file.url,
    publicId: req.file.filename || req.file.public_id,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
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
      url: req.file.path || req.file.secure_url || req.file.url,
      publicId: req.file.filename || req.file.public_id
    };

    res.json({
      message: 'Profile picture uploaded successfully',
      file: fileInfo
    });
  });
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete an uploaded file
// @access  Private
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    // Validate resource type
    const validTypes = ['image', 'video', 'raw'];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const result = await deleteFile(publicId, resourceType);

    if (result.result === 'ok' || result.result === 'not found') {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error while deleting file' });
  }
});

module.exports = router;
