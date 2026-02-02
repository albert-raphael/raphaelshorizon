const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/error');

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { 
      post: req.params.postId,
      parentComment: null,
      status: 'approved'
    };
    
    // Admin can see all comments
    if (req.user?.role === 'admin') {
      delete query.status;
    }
    
    const comments = await Comment.find(query)
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name avatar' },
        match: req.user?.role === 'admin' ? {} : { status: 'approved' }
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Comment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    
    // Check if post exists and allows comments
    const post = await Post.findById(postId);
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    if (!post.allowComments) {
      return next(new ErrorResponse('Comments are disabled for this post', 400));
    }
    
    // Check parent comment
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return next(new ErrorResponse('Parent comment not found', 404));
      }
    }
    
    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      parentComment: parentCommentId,
      content,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // Populate author info
    await comment.populate('author', 'name avatar');
    
    // Update post stats
    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.comments': 1 }
    });
    
    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalComments': 1 }
    });
    
    // Emit real-time event
    if (req.io) {
      req.io.to(`post-${postId}`).emit('comment-added', {
        comment,
        user: req.user
      });
    }
    
    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && comment.author.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this comment', 403));
    }
    
    // Save edit history
    if (!comment.editHistory) {
      comment.editHistory = [];
    }
    
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date()
    });
    
    // Update comment
    comment.content = req.body.content;
    comment.edited = true;
    await comment.save();
    
    res.status(200).json({
      success: true,
      comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && comment.author.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to delete this comment', 403));
    }
    
    // Soft delete (change status)
    comment.status = 'trash';
    await comment.save();
    
    // Or hard delete:
    // await comment.remove();
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }
    
    const userId = req.user._id;
    const hasLiked = comment.likes.includes(userId);
    
    if (hasLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      comment.likes.push(userId);
      // Remove from dislikes if present
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
    }
    
    await comment.save();
    
    res.status(200).json({
      success: true,
      liked: !hasLiked,
      likesCount: comment.likes.length,
      dislikesCount: comment.dislikes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate comment (admin only)
// @route   PUT /api/comments/:id/moderate
// @access  Private (Admin)
exports.moderateComment = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'spam', 'pending', 'trash'].includes(status)) {
      return next(new ErrorResponse('Invalid status', 400));
    }
    
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }
    
    res.status(200).json({
      success: true,
      comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comment statistics
// @route   GET /api/comments/stats
// @access  Private (Admin)
exports.getCommentStats = async (req, res, next) => {
  try {
    const stats = await Comment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Comment.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayComments = await Comment.countDocuments({
      createdAt: { $gte: today }
    });
    
    res.status(200).json({
      success: true,
      stats,
      total,
      todayComments
    });
  } catch (error) {
    next(error);
  }
};