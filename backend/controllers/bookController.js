const Book = require('../models/Book');
const { ErrorResponse } = require('../middleware/error');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const books = await Book.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('createdBy', 'name');

    if (!book) {
      return next(new ErrorResponse('Book not found', 404));
    }

    // Check if book is published or user is admin
    if (!book.isPublished && (!req.user || req.user.role !== 'admin')) {
      return next(new ErrorResponse('Book not found', 404));
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create book
// @route   POST /api/books
// @access  Private (Admin only)
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, category, coverImage, pdfUrl, audioUrl, price, isFree, tags } = req.body;

    const book = await Book.create({
      title,
      author,
      description,
      category,
      coverImage,
      pdfUrl,
      audioUrl,
      price: price || 0,
      isFree: isFree || false,
      tags: tags || [],
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
exports.updateBook = async (req, res, next) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return next(new ErrorResponse('Book not found', 404));
    }

    // Check ownership or admin
    if (book.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this book', 403));
    }

    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new ErrorResponse('Book not found', 404));
    }

    // Check ownership or admin
    if (book.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this book', 403));
    }

    await book.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get books by category
// @route   GET /api/books/category/:category
// @access  Public
exports.getBooksByCategory = async (req, res, next) => {
  try {
    const books = await Book.find({
      category: req.params.category,
      isPublished: true
    }).populate('createdBy', 'name').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish/Unpublish book
// @route   PUT /api/books/:id/publish
// @access  Private (Admin only)
exports.togglePublish = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new ErrorResponse('Book not found', 404));
    }

    book.isPublished = !book.isPublished;
    await book.save();

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};