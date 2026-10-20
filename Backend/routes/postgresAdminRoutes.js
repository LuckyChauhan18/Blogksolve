const express = require('express');
const router = express.Router();
const {
  getAdminBlogs,
  updateBlogStatus,
  getAdminUsers
} = require('../controller/postgresAdminController');
const { protect, authorize } = require('../middleware/postgresAuthMiddleware');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/blogs', getAdminBlogs);
router.patch('/blogs/:id/status', updateBlogStatus);
router.get('/users', getAdminUsers);

module.exports = router;
