const Post = require('../models/Post');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/error');
const slugify = require('slugify');
const mongoose = require('mongoose');

// @desc    Get all posts
// @route   GET /api/blog/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      author,
      status,
      featured,
      search,
      sort = '-publishedAt'
    } = req.query;
    
    // Build query
    let query = {};
    
    // Only show published posts for non-admin users
    if (req.user?.role !== 'admin') {
      query.status = 'published';
      query.publishedAt = { $lte: new Date() };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }
    
    // Filter by author
    if (author) {
      query.author = author;
    }
    
    // Filter by status (admin only)
    if (status && req.user?.role === 'admin') {
      query.status = status;
    }
    
    // Filter by featured
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count
    const total = await Post.countDocuments(query);
    
    // Calculate pages
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pages,
      currentPage: parseInt(page),
      posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/blog/posts/:id
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    let query = Post.findById(req.params.id)
      .populate('author', 'name avatar bio socialLinks')
      .populate('relatedPosts', 'title slug excerpt featuredImage.url category publishedAt');
    
    // If not admin, only show published posts
    if (!req.user || req.user.role !== 'admin') {
      query = query.where('status').equals('published')
        .where('publishedAt').lte(new Date());
    }
    
    const post = await query;
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Increment view count (track unique views separately)
    post.stats.views += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by slug
// @route   GET /api/blog/posts/slug/:slug
// @access  Public
exports.getPostBySlug = async (req, res, next) => {
  try {
    let query = Post.findOne({ slug: req.params.slug })
      .populate('author', 'name avatar bio socialLinks')
      .populate('relatedPosts', 'title slug excerpt featuredImage.url category publishedAt');
    
    // If not admin, only show published posts
    if (!req.user || req.user.role !== 'admin') {
      query = query.where('status').equals('published')
        .where('publishedAt').lte(new Date());
    }
    
    const post = await query;
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Increment view count
    post.stats.views += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new post
// @route   POST /api/blog/posts
// @access  Private (Author, Editor, Admin)
exports.createPost = async (req, res, next) => {
  try {
    // Generate slug if not provided
    let slug = req.body.slug;
    if (!slug) {
      slug = slugify(req.body.title, {
        lower: true,
        strict: true
      });
    }
    
    // Check if slug exists
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }
    
    // Set publishedAt if status is published
    if (req.body.status === 'published' && !req.body.publishedAt) {
      req.body.publishedAt = new Date();
    }
    
    // Set scheduledAt if status is scheduled
    if (req.body.status === 'scheduled' && req.body.scheduledAt) {
      req.body.publishedAt = req.body.scheduledAt;
    }
    
    // Create post
    const post = await Post.create({
      ...req.body,
      slug,
      author: req.user._id,
      tags: req.body.tags ? req.body.tags.map(tag => tag.toLowerCase()) : []
    });
    
    // Update user stats
    if (post.status === 'published') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.postsPublished': 1 }
      });
    }
    
    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/blog/posts/:id
// @access  Private (Author, Editor, Admin)
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this post', 403));
    }
    
    // Generate new slug if title changed
    if (req.body.title && req.body.title !== post.title && !req.body.slug) {
      let newSlug = slugify(req.body.title, {
        lower: true,
        strict: true
      });
      
      // Check if new slug exists
      const existingPost = await Post.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (existingPost) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      
      req.body.slug = newSlug;
    }
    
    // Update status timestamps
    if (req.body.status === 'published' && post.status !== 'published') {
      req.body.publishedAt = new Date();
    }
    
    if (req.body.status === 'scheduled' && req.body.scheduledAt) {
      req.body.publishedAt = req.body.scheduledAt;
    }
    
    // Update tags to lowercase
    if (req.body.tags) {
      req.body.tags = req.body.tags.map(tag => tag.toLowerCase());
    }
    
    // Update post
    post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar');
    
    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/blog/posts/:id
// @access  Private (Author, Editor, Admin)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to delete this post', 403));
    }
    
    // Soft delete (change status to archived)
    post.status = 'archived';
    await post.save();
    
    // Or hard delete:
    // await post.remove();
    
    res.status(200).json({
      success: true,
      message: 'Post archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories
// @route   GET /api/blog/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Post.aggregate([
      { $match: { status: 'published', publishedAt: { $lte: new Date() } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tags
// @route   GET /api/blog/tags
// @access  Public
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Post.aggregate([
      { $match: { status: 'published', publishedAt: { $lte: new Date() } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search posts
// @route   GET /api/blog/search
// @access  Public
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return next(new ErrorResponse('Please provide a search query', 400));
    }
    
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({
      $and: [
        { status: 'published', publishedAt: { $lte: new Date() } },
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { excerpt: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .populate('author', 'name avatar')
    .sort('-publishedAt')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
    
    const total = await Post.countDocuments({
      $and: [
        { status: 'published', publishedAt: { $lte: new Date() } },
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { excerpt: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    });
    
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pages,
      currentPage: parseInt(page),
      posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured posts
// @route   GET /api/blog/featured
// @access  Public
exports.getFeaturedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({
      featured: true,
      status: 'published',
      publishedAt: { $lte: new Date() }
    })
    .populate('author', 'name avatar')
    .sort('-publishedAt')
    .limit(5)
    .lean();
    
    res.status(200).json({
      success: true,
      posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related posts
// @route   GET /api/blog/posts/:id/related
// @access  Public
exports.getRelatedPosts = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    const relatedPosts = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ]
    })
    .populate('author', 'name avatar')
    .sort('-publishedAt')
    .limit(4)
    .lean();
    
    res.status(200).json({
      success: true,
      posts: relatedPosts
    });
  } catch (error) {
    next(error);
  }
};