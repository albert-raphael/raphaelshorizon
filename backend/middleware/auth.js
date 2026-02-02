const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      console.log('Auth token decoded:', decoded);
      
      // Get user from database or embedded store
      let user = null;
      if (!process.env.MONGO_URI) {
        const path = require('path');
        const fs = require('fs');
        const repoUsersPath = path.resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
        const backendUsersPath = path.resolve(__dirname, '..', 'embedded-data', 'users.json');
        let users = [];
        try {
          const r = fs.existsSync(repoUsersPath) ? JSON.parse(fs.readFileSync(repoUsersPath, 'utf8')) : [];
          const b = fs.existsSync(backendUsersPath) ? JSON.parse(fs.readFileSync(backendUsersPath, 'utf8')) : [];
          users = [...r, ...b];
        } catch (e) { users = []; }
        user = users.find(u => u._id === decoded.id);
        console.log('Embedded user found:', !!user, repoUsersPath, backendUsersPath);
      } else {
        user = await User.findById(decoded.id).select('-password');
        console.log('DB user found:', !!user);
      }
      
      if (!user) {
        console.warn('Authentication failed: user not found for id', decoded && decoded.id);
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
    }
  } catch (error) {
    next(error);
  }
};


// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Check if user is post author or admin
exports.authorizePost = async (req, res, next) => {
  try {
    const post = await req.model.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    // Check if user is admin or post author
    if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this resource'
      });
    }
    
    req.post = post;
    next();
  } catch (error) {
    next(error);
  }

};