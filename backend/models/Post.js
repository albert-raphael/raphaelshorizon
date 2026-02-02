const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Please provide a slug'],
    unique: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide an excerpt'],
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Faith & Belief',
      'Divine Guidance', 
      'Spiritual Growth',
      'God\'s Promises',
      'Life Purpose',
      'Our Mission',
      'Personal Growth',
      'Testimonies',
      'Biblical Teaching'
    ]
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  scheduledAt: Date,
  seo: {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String
  },
  readingTime: Number, // in minutes
  featured: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  media: [{
    type: String, // Cloudinary URLs
    description: String
  }],
  stats: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    readingTimeAvg: Number // Average reading time in seconds
  },
  engagement: {
    bounceRate: Number,
    scrollDepth: Number,
    timeOnPage: Number
  },
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  justOne: false
});

// Indexes for better performance
postSchema.index({ slug: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ featured: 1, publishedAt: -1 });

// Calculate reading time before save
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);