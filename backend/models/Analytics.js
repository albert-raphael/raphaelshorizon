const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  pageUrl: String,
  referrer: String,
  userAgent: String,
  ipAddress: String,
  country: String,
  city: String,
  device: String,
  browser: String,
  os: String,
  screenResolution: String,
  timeOnPage: Number, // in seconds
  scrollDepth: Number, // percentage
  isUnique: Boolean,
  sessionId: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Daily summary schema
const dailyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  totalViews: Number,
  uniqueVisitors: Number,
  totalPosts: Number,
  totalComments: Number,
  topPosts: [{
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    views: Number
  }],
  referrers: [{
    source: String,
    count: Number
  }],
  countries: [{
    country: String,
    count: Number
  }],
  devices: [{
    device: String,
    count: Number
  }]
});

// Indexes
pageViewSchema.index({ post: 1, createdAt: -1 });
pageViewSchema.index({ createdAt: 1 });
pageViewSchema.index({ sessionId: 1 });

dailyStatsSchema.index({ date: -1 });

module.exports = {
  PageView: mongoose.model('PageView', pageViewSchema),
  DailyStats: mongoose.model('DailyStats', dailyStatsSchema)
};