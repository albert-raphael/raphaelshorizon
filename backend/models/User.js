const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider !== 'google'; // Password not required for Google users
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'author', 'editor', 'subscriber'],
    default: 'subscriber'
  },
  avatar: {
    type: String,
    default: 'default-avatar.jpg'
  },
  googleId: {
    type: String,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    postsPublished: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});


// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate reset password token
userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Subscription fields
userSchema.add({
  subscription: {
    provider: { type: String, default: null },
    status: { type: String, enum: ['inactive','active','cancelled','past_due'], default: 'inactive' },
    planId: { type: String, default: null },
    subscriptionId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  }
});

userSchema.methods.isActiveSubscriber = function() {
  if (!this.subscription) return false;
  if (this.subscription.status !== 'active') return false;
  if (this.subscription.currentPeriodEnd && new Date() > new Date(this.subscription.currentPeriodEnd)) return false;
  return true;
};

userSchema.methods.activateSubscription = function ({ provider, planId, subscriptionId, currentPeriodEnd, metadata } = {}) {
  this.subscription = this.subscription || {};
  this.subscription.provider = provider || 'paypal';
  this.subscription.planId = planId || 'default';
  this.subscription.subscriptionId = subscriptionId || null;
  this.subscription.currentPeriodEnd = currentPeriodEnd || null;
  this.subscription.status = 'active';
  this.subscription.metadata = metadata || {};
  return this.save();
};

userSchema.methods.cancelSubscription = function () {
  this.subscription = this.subscription || {};
  this.subscription.status = 'cancelled';
  return this.save();
};

module.exports = mongoose.model('User', userSchema);