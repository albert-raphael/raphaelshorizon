const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

// Routes
router.post('/',
  authenticate,
  authorize('author', 'editor', 'admin'),
  upload.single('file'),
  uploadController.uploadFile
);

router.post('/multiple',
  authenticate,
  authorize('author', 'editor', 'admin'),
  upload.array('files', 10), // Max 10 files
  uploadController.uploadMultiple
);

router.get('/library',
  authenticate,
  authorize('author', 'editor', 'admin'),
  uploadController.getMediaLibrary
);

router.put('/:id',
  authenticate,
  authorize('author', 'editor', 'admin'),
  uploadController.updateMedia
);

router.delete('/:id',
  authenticate,
  authorize('author', 'editor', 'admin'),
  uploadController.deleteMedia
);

module.exports = router;