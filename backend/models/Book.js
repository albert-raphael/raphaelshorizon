const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a book title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  author: {
    type: String,
    required: [true, 'Please provide an author'],
    trim: true,
    maxlength: [50, 'Author name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['spiritual', 'inspirational', 'devotional', 'testimony', 'teaching', 'other']
  },
  coverImage: {
    type: String,
    default: 'default-book-cover.jpg'
  },
  pdfUrl: {
    type: String,
    required: [true, 'Please provide a PDF URL']
  },
  audioUrl: {
    type: String
  },
  price: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
bookSchema.index({ title: 'text', author: 'text', description: 'text' });

module.exports = mongoose.model('Book', bookSchema);