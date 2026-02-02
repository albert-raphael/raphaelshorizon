const cron = require('node-cron');
const Post = require('../models/Post');

// Run every minute to check for scheduled posts
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // Find scheduled posts that should be published
    const scheduledPosts = await Post.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });
    
    // Update status to published
    for (const post of scheduledPosts) {
      post.status = 'published';
      post.publishedAt = now;
      await post.save();
      
      console.log(`Published scheduled post: ${post.title}`);
    }
  } catch (error) {
    console.error('Error in scheduled posts cron job:', error);
  }
});

// Generate daily stats at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const DailyStats = require('../models/Analytics').DailyStats;
    const PageView = require('../models/Analytics').PageView;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get views data
    const viewsData = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: today }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueVisitors: {
            $addToSet: '$sessionId'
          }
        }
      }
    ]);
    
    // Get top posts
    const topPosts = await PageView.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: today },
          post: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$post',
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);
    
    // Save daily stats
    await DailyStats.create({
      date: yesterday,
      totalViews: viewsData[0]?.totalViews || 0,
      uniqueVisitors: viewsData[0]?.uniqueVisitors?.length || 0,
      totalPosts: await Post.countDocuments({ status: 'published' }),
      totalComments: await require('../models/Comment').countDocuments({ status: 'approved' }),
      topPosts: topPosts.map(item => ({
        post: item._id,
        views: item.views
      }))
    });
    
    console.log('Daily stats generated for:', yesterday.toDateString());
  } catch (error) {
    console.error('Error generating daily stats:', error);
  }
});