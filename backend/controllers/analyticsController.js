const { PageView, DailyStats } = require('../models/Analytics');
const Post = require('../models/Post');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/error');
const mongoose = require('mongoose');

// @desc    Track page view
// @route   POST /api/analytics/track
// @access  Public
exports.trackPageView = async (req, res, next) => {
  try {
    const {
      postId,
      pageUrl,
      referrer,
      userAgent,
      screenResolution,
      sessionId,
      timeOnPage,
      scrollDepth
    } = req.body;
    
    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get location info (you would use a service like ipinfo.io in production)
    let country = 'Unknown';
    let city = 'Unknown';
    
    // Check if this is a unique view for this session
    const isUnique = await PageView.findOne({
      sessionId,
      post: postId,
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
    });
    
    // Create page view
    const pageView = await PageView.create({
      post: postId,
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
      country,
      city,
      device: getDeviceType(userAgent),
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      screenResolution,
      timeOnPage,
      scrollDepth,
      isUnique: !isUnique,
      sessionId,
      userId: req.user?._id
    });
    
    // Update post stats if unique view
    if (pageView.isUnique && postId) {
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'stats.uniqueViews': 1 }
      });
    }
    
    res.status(200).json({
      success: true,
      tracked: true
    });
  } catch (error) {
    // Don't send error to client for analytics tracking
    res.status(200).json({
      success: true,
      tracked: false
    });
  }
};

// @desc    Get blog analytics
// @route   GET /api/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case '1y':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
    }
    
    // Get total stats
    const totalPosts = await Post.countDocuments({ status: 'published' });
    const totalViews = await PageView.countDocuments({ createdAt: { $gte: dateFilter } });
    const uniqueVisitors = await PageView.distinct('sessionId', { createdAt: { $gte: dateFilter } });
    const totalComments = await mongoose.model('Comment').countDocuments({ status: 'approved' });
    
    // Get daily stats
    const dailyStats = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          views: { $sum: 1 },
          uniqueViews: {
            $sum: { $cond: ['$isUnique', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get top posts
    const topPosts = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter },
          post: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$post',
          views: { $sum: 1 },
          uniqueViews: {
            $sum: { $cond: ['$isUnique', 1, 0] }
          }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate post details
    const postIds = topPosts.map(item => item._id);
    const posts = await Post.find({ _id: { $in: postIds } })
      .select('title slug category featuredImage.url')
      .lean();
    
    const topPostsWithDetails = topPosts.map(item => {
      const post = posts.find(p => p._id.toString() === item._id.toString());
      return {
        ...item,
        post: post || { title: 'Unknown Post' }
      };
    });
    
    // Get referrers
    const referrers = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter },
          referrer: { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get device stats
    const devices = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter },
          device: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      analytics: {
        period,
        totalPosts,
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        totalComments,
        dailyStats,
        topPosts: topPostsWithDetails,
        referrers,
        devices
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post analytics
// @route   GET /api/analytics/posts/:postId
// @access  Private (Author, Admin)
exports.getPostAnalytics = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to view analytics for this post', 403));
    }
    
    const { period = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case 'all':
        dateFilter = null;
        break;
    }
    
    const matchCondition = { post: post._id };
    if (dateFilter) {
      matchCondition.createdAt = { $gte: dateFilter };
    }
    
    // Get views data
    const viewsData = await PageView.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          views: { $sum: 1 },
          uniqueViews: {
            $sum: { $cond: ['$isUnique', 1, 0] }
          },
          avgTimeOnPage: { $avg: '$timeOnPage' },
          avgScrollDepth: { $avg: '$scrollDepth' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get referrers for this post
    const referrers = await PageView.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$referrer',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get engagement metrics
    const engagement = await PageView.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          avgTimeOnPage: { $avg: '$timeOnPage' },
          avgScrollDepth: { $avg: '$scrollDepth' },
          bounceRate: {
            $avg: {
              $cond: [{ $lt: ['$timeOnPage', 10] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get comments data
    const comments = await mongoose.model('Comment').countDocuments({
      post: post._id,
      status: 'approved'
    });
    
    res.status(200).json({
      success: true,
      analytics: {
        post: {
          title: post.title,
          slug: post.slug,
          publishedAt: post.publishedAt
        },
        totals: {
          views: post.stats.views,
          uniqueViews: post.stats.uniqueViews,
          comments: post.stats.comments || 0,
          likes: post.stats.likes || 0,
          shares: post.stats.shares || 0
        },
        viewsData,
        referrers,
        engagement: engagement[0] || {},
        comments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  if (/iPad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function getBrowser(userAgent) {
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'Other';
}

function getOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Other';
}