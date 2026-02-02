const User = require('../models/User');
const { ErrorResponse } = require('../middleware/error');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Embedded mode support
console.error('AUTH_CONTROLLER: Loading authController.js');
const EMBEDDED_MODE = process.env.NODE_ENV !== 'database' && !process.env.MONGODB_URI;
console.error('AUTH_CONTROLLER: EMBEDDED_MODE =', EMBEDDED_MODE);
console.error('AUTH_CONTROLLER: NODE_ENV =', process.env.NODE_ENV);
console.error('AUTH_CONTROLLER: MONGODB_URI =', process.env.MONGODB_URI);
const embeddedStore = require('../embeddedStore');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // If MONGO_URI is not set, use embedded JSON store for users (for local E2E/test)
    if (!process.env.MONGO_URI) {
      const usersPath = path.resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
      let users = [];
      try { users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf8')) : []; } catch (e) { users = []; }

      if (users.some(u => u.email === email)) return next(new ErrorResponse('User already exists', 400));

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const id = Date.now().toString(36);

      const newUser = {
        _id: id,
        name,
        email,
        password: hashed,
        role: role || 'author',
        avatar: 'default-avatar.jpg',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRE || '7d' });

      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(201).json({ success: true, token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    }

    // Default DB-backed path
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists', 400));
    }

    // Create user
    const user = await User.create({ name, email, password, role: role || 'author' });

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email (best-effort; do not fail registration if email fails)
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;

    const message = `
      <h1>Welcome to Raphael's Horizon</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'Email Verification - Raphael\'s Horizon', html: message });
    } catch (emailErr) {
      console.warn('Email sending failed (continuing registration):', emailErr && emailErr.message ? emailErr.message : emailErr);
    }

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Embedded mode login
    if (!process.env.MONGO_URI) {
      const usersPath = path.resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
      let users = [];
      try { users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf8')) : []; } catch (e) { users = []; }

      const user = users.find(u => u.email === email);
      if (!user) return next(new ErrorResponse('Invalid credentials', 401));

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

      // Update lastLogin in users file
      user.lastLogin = new Date().toISOString();
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // Embedded mode: read from JSON store
    if (!process.env.MONGO_URI) {
      const usersPath = path.resolve(__dirname, '..', '..', 'embedded-data', 'users.json');
      let users = [];
      try { users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf8')) : []; } catch (e) { users = []; }
      const user = users.find(u => u._id === req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, user });
    }

    const user = await User.findById(req.user.id);

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000)
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return next(new ErrorResponse('No user found with this email', 404));
    }
    
    // Get reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();
    
    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Raphael\'s Horizon',
      html: message
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    // Generate new token
    const token = user.generateAuthToken();
    
    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }

};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    console.log('ADMIN_LOGIN: Function called');
    const { email, password } = req.body;
    console.log('ADMIN_LOGIN: Email from request:', email);
    console.log('ADMIN_LOGIN: Password provided:', !!password);

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    let user;

    if (EMBEDDED_MODE) {
      // Find user in embedded storage
      process.stderr.write(`ADMIN_LOGIN: EMBEDDED_MODE: true, embeddedUsers length: ${embeddedStore.users.length}\n`);
      process.stderr.write(`ADMIN_LOGIN: Email to find: ${email}\n`);
      user = embeddedStore.users.find(u => u.email === email);
      process.stderr.write(`ADMIN_LOGIN: User found: ${!!user}\n`);
      if (!user) {
        process.stderr.write(`ADMIN_LOGIN: User not found for email: ${email}\n`);
        return next(new ErrorResponse('Invalid credentials', 401));
      }
    } else {
      // Check for user in database
      user = await User.findOne({ email }).select('+password');
      if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
      }
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return next(new ErrorResponse('Access denied. Admin privileges required.', 403));
    }

    // Check if password matches
    let isMatch;
    if (EMBEDDED_MODE) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = await user.comparePassword(password);
    }

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Update last login
    if (EMBEDDED_MODE) {
      user.lastLogin = new Date();
      // Save to file
      try {
        fs.writeFileSync(path.join(__dirname, '../embedded-data/users.json'), JSON.stringify(embeddedUsers, null, 2));
      } catch (error) {
        console.error('Failed to update user lastLogin:', error);
      }
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate token (simplified for embedded mode)
    let token;
    if (EMBEDDED_MODE) {
      token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'raphaels_horizon_jwt_secret_2024_secure_key_change_this_in_production',
        { expiresIn: '7d' }
      );
    } else {
      token = user.generateAuthToken();
    }

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};