const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', bookController.getBooks);
router.get('/category/:category', bookController.getBooksByCategory);
router.get('/:id', bookController.getBook);

// Protected routes (Admin only)
router.post('/', authenticate, bookController.createBook);
router.put('/:id', authenticate, bookController.updateBook);
router.put('/:id/publish', authenticate, bookController.togglePublish);
router.delete('/:id', authenticate, bookController.deleteBook);

module.exports = router;