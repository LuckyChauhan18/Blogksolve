const Blog = require('../models/Blog');

// @desc    Get all approved blogs for public feed
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    // Only approved blogs are shown publicly in Version 4
    const filter = { status: 'approved' };

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blog details',
      error: error.message
    });
  }
};

// @desc    Create a new blog (Enters 'pending' status for normal users)
// @route   POST /api/blogs
// @access  Private
const createBlog = async (req, res) => {
  try {
    const { title, content, summary } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the blog'
      });
    }

    // Admins can publish directly; normal users require Admin review
    const initialStatus = req.user && req.user.role === 'admin' ? 'approved' : 'pending';

    const newBlog = await Blog.create({
      title,
      content,
      author: req.user ? req.user.name : (req.body.author || 'Anonymous Writer'),
      user: req.user ? req.user._id : null,
      summary,
      status: initialStatus
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved' 
        ? 'Blog published successfully' 
        : 'Blog submitted for Admin review. It will appear publicly once approved.',
      status: initialStatus,
      data: newBlog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private (Author or Admin)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Authorization: User must be author or an admin
    if (req.user && blog.user && blog.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog post'
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  deleteBlog
};
