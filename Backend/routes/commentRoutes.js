const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getCommentsByBlog,
  addComment,
  deleteComment
} = require('../controller/commentController');
const { protect } = require('../middleware/authMiddleware');

// Routes mounted at /api/blogs/:blogId/comments
router.route('/')
  .get(getCommentsByBlog)
  .post(protect, addComment);

// Direct comment deletion at /api/comments/:commentId
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
