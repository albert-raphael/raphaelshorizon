const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  url: {
    type: String,
    required: true
  },
  thumbnail: String,
  format: String,
  size: Number, // in bytes
  width: Number,
  height: Number,
  duration: Number, // for videos in seconds
  alt: String,
  caption: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: String,
    default: 'blog'
  },
  tags: [String],
  metadata: {
    type: Map,
    of: String
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ isUsed: 1 });

module.exports = mongoose.model('Media', mediaSchema);