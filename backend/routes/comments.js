const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateComment } = require('../middleware/validation');

// Public routes
router.get('/post/:postId', commentController.getComments);

// Protected routes
router.post('/',
  authenticate,
  validate(validateComment),
  commentController.createComment
);

router.put('/:id',
  authenticate,
  commentController.updateComment
);

router.delete('/:id',
  authenticate,
  commentController.deleteComment
);

router.post('/:id/like',
  authenticate,
  commentController.toggleLike
);

// Admin routes
router.put('/:id/moderate',
  authenticate,
  authorize('admin', 'editor'),
  commentController.moderateComment
);

router.get('/stats',
  authenticate,
  authorize('admin', 'editor'),
  commentController.getCommentStats
);

module.exports = router;