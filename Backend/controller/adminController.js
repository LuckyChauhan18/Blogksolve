const Blog = require('../models/Blog');
const User = require('../models/User');

// @desc    Get all blogs for Admin review (grouped by pending vs fulfilled)
// @route   GET /api/admin/blogs
// @access  Private (Admin only)
const getAdminBlogs = async (req, res) => {
  try {
    const pendingBlogs = await Blog.find({ status: 'pending' })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    const fulfilledBlogs = await Blog.find({ status: { $in: ['approved', 'declined'] } })
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        pendingCount: pendingBlogs.length,
        fulfilledCount: fulfilledBlogs.length,
        pendingBlogs,
        fulfilledBlogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin blogs',
      error: error.message
    });
  }
};

// @desc    Accept or Decline a blog request
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private (Admin only)
const updateBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "approved" or "declined"'
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    blog.status = status;
    blog.reviewedBy = req.user._id;
    blog.reviewedAt = new Date();

    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog request successfully ${status === 'approved' ? 'ACCEPTED (Now Public)' : 'DECLINED'}`,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update blog status',
      error: error.message
    });
  }
};

// @desc    Get all users categorized into requested users, fulfilled users, and general list
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Aggregate blogs per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const blogs = await Blog.find({ user: u._id });
        const pendingCount = blogs.filter((b) => b.status === 'pending').length;
        const approvedCount = blogs.filter((b) => b.status === 'approved').length;
        const declinedCount = blogs.filter((b) => b.status === 'declined').length;

        return {
          ...u.toObject(),
          totalBlogs: blogs.length,
          pendingCount,
          approvedCount,
          declinedCount,
          hasPendingRequest: pendingCount > 0,
          hasFulfilledRequest: approvedCount > 0 || declinedCount > 0
        };
      })
    );

    // Grouping for admin dashboard
    const requestedUsers = usersWithStats.filter((u) => u.hasPendingRequest);
    const fulfilledUsers = usersWithStats.filter((u) => u.hasFulfilledRequest);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersWithStats.length,
        requestedUsersCount: requestedUsers.length,
        fulfilledUsersCount: fulfilledUsers.length,
        requestedUsers,
        fulfilledUsers,
        allUsers: usersWithStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin user list',
      error: error.message
    });
  }
};

module.exports = {
  getAdminBlogs,
  updateBlogStatus,
  getAdminUsers
};
