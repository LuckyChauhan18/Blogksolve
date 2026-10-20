const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getCommentsByBlog,
  addComment,
  deleteComment
} = require('../controller/postgresCommentController');
const { protect } = require('../middleware/postgresAuthMiddleware');

router.route('/')
  .get(getCommentsByBlog)
  .post(protect, addComment);

router.delete('/:commentId', protect, deleteComment);

module.exports = router;
