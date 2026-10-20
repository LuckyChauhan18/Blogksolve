const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags
} = require('../controller/postgresBlogController');
const { protect } = require('../middleware/postgresAuthMiddleware');

// Mount comment routes nested under /api/blogs/:blogId/comments
router.use('/:blogId/comments', require('./postgresCommentRoutes'));

// Tags route
router.get('/tags/all', getAllTags);

router.route('/')
  .get(getAllBlogs)
  .post(protect, createBlog);

router.route('/:id')
  .get(getBlogById)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

module.exports = router;
