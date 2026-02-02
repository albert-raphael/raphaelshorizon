const { body, param, query, validationResult } = require('express-validator');

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      errors: errors.array()
    });
  };
};

// Blog post validation
exports.validatePost = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  
  body('slug')
    .trim()
    .notEmpty().withMessage('Slug is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase with hyphens'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required'),
  
  body('category')
    .isIn([
      'Faith & Belief',
      'Divine Guidance', 
      'Spiritual Growth',
      'God\'s Promises',
      'Life Purpose',
      'Our Mission',
      'Personal Growth',
      'Testimonies',
      'Biblical Teaching'
    ]).withMessage('Invalid category'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled', 'archived'])
    .withMessage('Invalid status')
];

// Comment validation
exports.validateComment = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
  
  body('postId')
    .notEmpty().withMessage('Post ID is required')
    .isMongoId().withMessage('Invalid Post ID')
];

// User validation
exports.validateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];