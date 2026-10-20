const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  deleteBlog
} = require('../controller/blogController');

// Routes for /api/blogs
router.route('/')
  .get(getAllBlogs)
  .post(createBlog);

router.route('/:id')
  .get(getBlogById)
  .delete(deleteBlog);

module.exports = router;
