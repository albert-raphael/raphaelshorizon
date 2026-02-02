const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route for tracking
router.post('/track', analyticsController.trackPageView);

// Protected routes
router.get('/',
  authenticate,
  authorize('admin', 'editor'),
  analyticsController.getAnalytics
);

router.get('/posts/:postId',
  authenticate,
  authorize('author', 'editor', 'admin'),
  analyticsController.getPostAnalytics
);

module.exports = router;