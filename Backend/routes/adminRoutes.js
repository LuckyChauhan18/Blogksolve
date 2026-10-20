const express = require('express');
const router = express.Router();
const {
  getAdminBlogs,
  updateBlogStatus,
  getAdminUsers
} = require('../controller/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this router require being logged in AND having 'admin' role
router.use(protect, authorize('admin'));

router.get('/blogs', getAdminBlogs);
router.patch('/blogs/:id/status', updateBlogStatus);
router.get('/users', getAdminUsers);

module.exports = router;
