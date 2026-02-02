const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Embedded data paths
const USERS_FILE = path.join(__dirname, '../embedded-data/users.json');
const embeddedStore = require('../embeddedStore');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('application/pdf') || 
      file.mimetype.startsWith('audio/') || 
      file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, audio, and image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Helper functions for embedded data
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

function findUserById(id) {
  const users = loadUsers();
  return users.find(u => u._id === id || u.id === id);
}

function findUserByEmail(email) {
  const users = loadUsers();
  return users.find(u => u.email === email);
}

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = findUserById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Get admin dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const users = loadUsers();
    const books = embeddedStore.books || [];
    const posts = embeddedStore.posts || [];

    // Calculate user stats
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const subscriberUsers = users.filter(u => u.role === 'subscriber' || !u.role).length;
    const activeSubscriptions = users.filter(u => u.subscription?.status === 'active').length;

    // Calculate recent activity
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = users.filter(u => new Date(u.createdAt) > weekAgo).length;

    res.json({
      success: true,
      data: {
        totalUsers,
        adminUsers,
        subscriberUsers,
        activeSubscriptions,
        recentUsers,
        totalBooks: books.length,
        totalPosts: posts.length,
        revenue: {
          monthly: 0,
          total: 0
        },
        recentActivity: users
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(u => ({
            type: 'user_registration',
            user: u.name,
            email: u.email,
            date: u.createdAt
          }))
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all users (for admin)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = loadUsers();
    const { page = 1, limit = 10, search, role } = req.query;

    let filteredUsers = users;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.name?.toLowerCase().includes(searchLower) || 
        u.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    // Sort by created date
    filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(skip, skip + parseInt(limit));

    // Remove passwords from response
    const safeUsers = paginatedUsers.map(({ password, ...user }) => user);

    res.json({
      success: true,
      data: safeUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user role
router.put('/users/:id/role', verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'author', 'editor', 'subscriber'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const users = loadUsers();
    const userIndex = users.findIndex(u => u._id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    users[userIndex].role = role;
    saveUsers(users);

    const { password, ...safeUser } = users[userIndex];
    res.json({
      success: true,
      data: safeUser
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const users = loadUsers();
    const userIndex = users.findIndex(u => u._id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (users[userIndex]._id === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    users.splice(userIndex, 1);
    saveUsers(users);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all books (for admin)
router.get('/books', verifyAdmin, async (req, res) => {
  try {
    const books = embeddedStore.books || [];
    res.json({
      success: true,
      data: books,
      pagination: {
        page: 1,
        limit: books.length,
        total: books.length,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all blog posts (for admin)
router.get('/posts', verifyAdmin, async (req, res) => {
  try {
    const posts = embeddedStore.posts || [];
    res.json({
      success: true,
      data: posts,
      pagination: {
        page: 1,
        limit: posts.length,
        total: posts.length,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get site settings
router.get('/settings', verifyAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        siteName: "Raphael's Horizon",
        siteDescription: 'Christian literature, audiobooks, and spiritual resources',
        contactEmail: process.env.CONTACT_EMAIL || 'contact@raphaelshorizon.com',
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: ''
        },
        features: {
          donations: true,
          subscriptions: true,
          comments: true,
          newsletter: true
        },
        payment: {
          stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
          paypalEnabled: !!process.env.PAYPAL_CLIENT_ID
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// File upload
router.post('/upload', verifyAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      data: {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
});

module.exports = router;