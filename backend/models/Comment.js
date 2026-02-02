const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  content: {
    type: String,
    required: [true, 'Please provide comment content'],
    maxlength: [2000, 'Comment cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'spam', 'trash'],
    default: 'pending'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  userAgent: String,
  ipAddress: String,
  isAuthor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  justOne: false
});

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ status: 1 });

// Middleware to check if commenter is post author
commentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const post = await mongoose.model('Post').findById(this.post);
    if (post && post.author.toString() === this.author.toString()) {
      this.isAuthor = true;
      this.status = 'approved'; // Auto-approve author comments
    }
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);