const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticate, authorize, authorizePost } = require('../middleware/auth');
const { validate, validatePost } = require('../middleware/validation');

// Public routes
router.get('/posts', blogController.getPosts);
router.get('/posts/slug/:slug', blogController.getPostBySlug);
router.get('/posts/:id', blogController.getPost);
router.get('/categories', blogController.getCategories);
router.get('/tags', blogController.getTags);
router.get('/search', blogController.searchPosts);
router.get('/featured', blogController.getFeaturedPosts);
router.get('/posts/:id/related', blogController.getRelatedPosts);

// Protected routes (Authors, Editors, Admins)
router.post('/posts', 
  authenticate, 
  authorize('author', 'editor', 'admin'),
  validate(validatePost),
  blogController.createPost
);

router.put('/posts/:id',
  authenticate,
  authorize('author', 'editor', 'admin'),
  blogController.updatePost
);

router.delete('/posts/:id',
  authenticate,
  authorize('author', 'editor', 'admin'),
  blogController.deletePost
);

// Admin only routes
router.get('/admin/posts',
  authenticate,
  authorize('admin', 'editor'),
  blogController.getPosts
);

module.exports = router;