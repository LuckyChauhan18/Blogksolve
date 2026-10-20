const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  deleteBlog
} = require('../controller/blogController');
const { protect } = require('../middleware/authMiddleware');

// Public can read blogs, but writing requires authentication
router.route('/')
  .get(getAllBlogs)
  .post(protect, createBlog);

router.route('/:id')
  .get(getBlogById)
  .delete(protect, deleteBlog);

module.exports = router;
