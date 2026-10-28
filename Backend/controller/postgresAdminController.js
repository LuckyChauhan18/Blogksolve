const { query } = require('../config/postgres');

// @desc    Get all blogs for Admin review (grouped by pending vs fulfilled)
// @route   GET /api/admin/blogs
// @access  Private (Admin only)
const getAdminBlogs = async (req, res) => {
  try {
    const sql = `
      SELECT 
        b.id,
        b.id as _id,
        b.title,
        b.content,
        b.summary,
        b.author_name as author,
        b.user_id,
        b.cover_image as "coverImage",
        b.status,
        b.created_at,
        b.created_at as "createdAt",
        b.reviewed_at,
        u.email as "authorEmail",
        u.role as "authorRole",
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM blogs b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN blog_tags bt ON b.id = bt.blog_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      GROUP BY b.id, u.email, u.role
      ORDER BY b.created_at DESC
    `;

    const result = await query(sql);
    const allBlogs = result.rows;

    const pendingBlogs = allBlogs.filter(b => b.status === 'pending');
    const fulfilledBlogs = allBlogs.filter(b => b.status === 'approved' || b.status === 'declined');

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

// @desc    Accept or Decline a blog request in PostgreSQL
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

    const updateSql = `
      UPDATE blogs
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(updateSql, [status, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Blog request successfully ${status === 'approved' ? 'ACCEPTED (Now Public)' : 'DECLINED'}`,
      data: result.rows[0]
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
    const usersSql = `
      SELECT 
        u.id,
        u.id as _id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(b.id)::int as "totalBlogs",
        COUNT(b.id) FILTER (WHERE b.status = 'pending')::int as "pendingCount",
        COUNT(b.id) FILTER (WHERE b.status = 'approved')::int as "approvedCount",
        COUNT(b.id) FILTER (WHERE b.status = 'declined')::int as "declinedCount"
      FROM users u
      LEFT JOIN blogs b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const result = await query(usersSql);
    const usersWithStats = result.rows.map(u => ({
      ...u,
      hasPendingRequest: u.pendingCount > 0,
      hasFulfilledRequest: u.approvedCount > 0 || u.declinedCount > 0
    }));

    const requestedUsers = usersWithStats.filter(u => u.hasPendingRequest);
    const fulfilledUsers = usersWithStats.filter(u => u.hasFulfilledRequest);

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
