const cloudinary = require('cloudinary').v2;
const Media = require('../models/Media');
const { ErrorResponse } = require('../middleware/error');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Upload single file
// @route   POST /api/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a file', 400));
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'raphaels-horizon/blog',
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    // Create thumbnail for images
    let thumbnailUrl = result.url;
    if (result.resource_type === 'image') {
      const thumbnail = result.url.replace('/upload/', '/upload/w_300,h_200,c_fill/');
      thumbnailUrl = thumbnail;
    }
    
    // Save to database
    const media = await Media.create({
      filename: result.public_id,
      originalName: req.file.originalname,
      url: result.secure_url,
      thumbnail: thumbnailUrl,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      uploadedBy: req.user._id,
      folder: 'blog',
      metadata: {
        resource_type: result.resource_type,
        asset_id: result.asset_id,
        version: result.version.toString(),
        signature: result.signature
      }
    });
    
    // Delete local file
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({
      success: true,
      media
    });
  } catch (error) {
    // Clean up local file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
exports.uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse('Please upload files', 400));
    }
    
    const uploadPromises = req.files.map(async (file) => {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'raphaels-horizon/blog',
        resource_type: 'auto',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });
      
      // Create thumbnail for images
      let thumbnailUrl = result.url;
      if (result.resource_type === 'image') {
        const thumbnail = result.url.replace('/upload/', '/upload/w_300,h_200,c_fill/');
        thumbnailUrl = thumbnail;
      }
      
      // Save to database
      const media = await Media.create({
        filename: result.public_id,
        originalName: file.originalname,
        url: result.secure_url,
        thumbnail: thumbnailUrl,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        uploadedBy: req.user._id,
        folder: 'blog',
        metadata: {
          resource_type: result.resource_type,
          asset_id: result.asset_id,
          version: result.version.toString(),
          signature: result.signature
        }
      });
      
      // Delete local file
      fs.unlinkSync(file.path);
      
      return media;
    });
    
    const mediaItems = await Promise.all(uploadPromises);
    
    res.status(201).json({
      success: true,
      count: mediaItems.length,
      media: mediaItems
    });
  } catch (error) {
    // Clean up local files if error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

// @desc    Get media library
// @route   GET /api/upload/library
// @access  Private
exports.getMediaLibrary = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type, // image, video
      search,
      sort = '-createdAt'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    let query = { uploadedBy: req.user._id };
    
    // Filter by type
    if (type === 'image') {
      query['metadata.resource_type'] = 'image';
    } else if (type === 'video') {
      query['metadata.resource_type'] = 'video';
    }
    
    // Search
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { filename: { $regex: search, $options: 'i' } }
      ];
    }
    
    const media = await Media.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Media.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: media.length,
      total,
      media
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete media
// @route   DELETE /api/upload/:id
// @access  Private
exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return next(new ErrorResponse('Media not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && media.uploadedBy.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to delete this media', 403));
    }
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(media.filename, {
      resource_type: media.metadata.get('resource_type')
    });
    
    // Delete from database
    await media.remove();
    
    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update media metadata
// @route   PUT /api/upload/:id
// @access  Private
exports.updateMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return next(new ErrorResponse('Media not found', 404));
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && media.uploadedBy.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to update this media', 403));
    }
    
    // Update metadata
    media.alt = req.body.alt || media.alt;
    media.caption = req.body.caption || media.caption;
    media.tags = req.body.tags || media.tags;
    
    await media.save();
    
    res.status(200).json({
      success: true,
      media
    });
  } catch (error) {
    next(error);
  }
};