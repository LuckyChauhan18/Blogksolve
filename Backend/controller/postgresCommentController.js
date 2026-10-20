const { query } = require('../config/postgres');

// @desc    Get hierarchical comments for a blog post (1st level comments + their nested replies)
// @route   GET /api/blogs/:blogId/comments
// @access  Public
const getCommentsByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    const sql = `
      SELECT 
        c.id,
        c.id as _id,
        c.blog_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.created_at,
        c.created_at as "createdAt",
        u.name as "userName",
        u.role as "userRole"
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.blog_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await query(sql, [blogId]);
    const allComments = result.rows;

    // Build 2-level threaded comments hierarchy
    const topLevelComments = [];
    const commentMap = new Map();

    // First pass: index top-level comments
    for (let c of allComments) {
      c.replies = [];
      commentMap.set(c.id, c);
      if (!c.parent_id) {
        topLevelComments.push(c);
      }
    }

    // Second pass: attach replies to their respective first-level comment
    for (let c of allComments) {
      if (c.parent_id) {
        const parent = commentMap.get(c.parent_id);
        if (parent) {
          parent.replies.push(c);
        } else {
          // If parent was deleted or not found, place as top-level fallback
          topLevelComments.push(c);
        }
      }
    }

    // Sort top-level comments latest first
    topLevelComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      count: allComments.length,
      data: topLevelComments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: error.message
    });
  }
};

// @desc    Add a comment or reply to a first-level comment
// @route   POST /api/blogs/:blogId/comments
// @access  Private (Logged in users only)
const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment text'
      });
    }

    // Verify blog exists
    const blogCheck = await query('SELECT id FROM blogs WHERE id = $1', [blogId]);
    if (blogCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // If parentId provided, verify parent comment exists
    let validParentId = null;
    if (parentId) {
      const parentCheck = await query('SELECT id FROM comments WHERE id = $1 AND blog_id = $2', [parentId, blogId]);
      if (parentCheck.rows.length > 0) {
        validParentId = parentId;
      }
    }

    const insertSql = `
      INSERT INTO comments (blog_id, user_id, parent_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, id as _id, blog_id, user_id, parent_id, content, created_at, created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      blogId,
      req.user.id,
      validParentId,
      content.trim()
    ]);

    const createdComment = result.rows[0];
    createdComment.userName = req.user.name;
    createdComment.userRole = req.user.role;
    createdComment.replies = [];

    res.status(201).json({
      success: true,
      message: validParentId ? 'Reply posted successfully' : 'Comment posted successfully',
      data: createdComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post comment',
      error: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private (Author or Admin)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const existing = await query('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = existing.rows[0];

    // Authorization check: User must be comment owner or an Admin
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    await query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

module.exports = {
  getCommentsByBlog,
  addComment,
  deleteComment
};
