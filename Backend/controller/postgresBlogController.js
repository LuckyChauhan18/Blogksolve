const { query } = require('../config/postgres');

// Helper to save and associate tags with a blog
const syncBlogTags = async (blogId, tagNames = []) => {
  if (!Array.isArray(tagNames) || tagNames.length === 0) return [];

  // Remove existing associations
  await query('DELETE FROM blog_tags WHERE blog_id = $1', [blogId]);

  const assignedTags = [];
  for (let rawName of tagNames) {
    const cleanName = rawName.trim().replace(/^#/, '');
    if (!cleanName) continue;

    // Insert tag or get existing
    let tagResult = await query(
      `INSERT INTO tags (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [cleanName]
    );

    const tagId = tagResult.rows[0].id;
    await query(
      `INSERT INTO blog_tags (blog_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [blogId, tagId]
    );

    assignedTags.push(cleanName);
  }

  return assignedTags;
};

// @desc    Get all public approved blogs (with optional tag & search filtering)
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const { tag, search } = req.query;

    let sql = `
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
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM blogs b
      LEFT JOIN blog_tags bt ON b.id = bt.blog_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.status = 'approved'
    `;

    const params = [];

    if (tag && tag.trim()) {
      params.push(tag.trim().replace(/^#/, ''));
      sql += ` AND b.id IN (
        SELECT bt2.blog_id FROM blog_tags bt2 
        JOIN tags t2 ON bt2.tag_id = t2.id 
        WHERE LOWER(t2.name) = LOWER($${params.length})
      )`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (b.title ILIKE $${params.length} OR b.content ILIKE $${params.length} OR b.author_name ILIKE $${params.length})`;
    }

    sql += ` GROUP BY b.id ORDER BY b.created_at DESC`;

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs from PostgreSQL',
      error: error.message
    });
  }
};

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

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
        COALESCE(
          json_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '[]'
        ) as tags
      FROM blogs b
      LEFT JOIN blog_tags bt ON b.id = bt.blog_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = $1
      GROUP BY b.id
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blog details',
      error: error.message
    });
  }
};

// @desc    Create a new blog with tags & approval workflow
// @route   POST /api/blogs
// @access  Private (Signed-in users)
const createBlog = async (req, res) => {
  try {
    const { title, content, summary, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the story'
      });
    }

    const autoSummary = summary || content.substring(0, 160).replace(/<[^>]*>?/gm, '') + '...';
    const authorName = req.user.name;
    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    const insertSql = `
      INSERT INTO blogs (title, content, summary, author_name, user_id, cover_image, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, id as _id, title, content, summary, author_name as author, user_id, cover_image as "coverImage", status, created_at, created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      title.trim(),
      content.trim(),
      autoSummary.trim(),
      authorName,
      req.user.id,
      coverImage,
      initialStatus
    ]);

    const createdBlog = result.rows[0];

    // Process and attach tags
    const cleanTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
    createdBlog.tags = await syncBlogTags(createdBlog.id, cleanTags);

    res.status(201).json({
      success: true,
      message: initialStatus === 'approved'
        ? 'Blog published successfully'
        : 'Blog submitted for Admin review. It will appear publicly once approved.',
      status: initialStatus,
      data: createdBlog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// @desc    Update / Edit an existing blog (Author or Admin authorization)
// @route   PUT /api/blogs/:id
// @access  Private (Author or Admin)
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, tags } = req.body;

    const existing = await query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const blog = existing.rows[0];

    // Resource Authorization Check
    if (blog.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this story'
      });
    }

    const updatedTitle = title !== undefined ? title.trim() : blog.title;
    const updatedContent = content !== undefined ? content.trim() : blog.content;
    const updatedSummary = summary !== undefined ? summary.trim() : (updatedContent.substring(0, 160) + '...');
    const updatedCoverImage = req.file ? `/uploads/${req.file.filename}` : blog.cover_image;

    const updateSql = `
      UPDATE blogs
      SET title = $1, content = $2, summary = $3, cover_image = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, id as _id, title, content, summary, author_name as author, user_id, cover_image as "coverImage", status, created_at, created_at as "createdAt"
    `;

    const result = await query(updateSql, [updatedTitle, updatedContent, updatedSummary, updatedCoverImage, id]);
    const updatedBlog = result.rows[0];

    if (tags !== undefined) {
      const cleanTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
      updatedBlog.tags = await syncBlogTags(id, cleanTags);
    }

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private (Author or Admin)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const blog = existing.rows[0];

    // Authorization: Author or Admin
    if (blog.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this story'
      });
    }

    await query('DELETE FROM blogs WHERE id = $1', [id]);

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

// @desc    Get all popular tags with blog count
// @route   GET /api/tags
// @access  Public
const getAllTags = async (req, res) => {
  try {
    const sql = `
      SELECT t.id, t.name, COUNT(bt.blog_id)::int as count
      FROM tags t
      INNER JOIN blog_tags bt ON t.id = bt.tag_id
      INNER JOIN blogs b ON bt.blog_id = b.id
      WHERE b.status = 'approved'
      GROUP BY t.id, t.name
      ORDER BY count DESC, t.name ASC
    `;
    const result = await query(sql);
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tags',
      error: error.message
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags
};
