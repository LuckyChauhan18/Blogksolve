const mongoose = require('mongoose');

// Clean and understandable Comment Schema for Version 3
const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog ID is required for comment']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for comment']
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    content: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Index for fast comment retrieval per blog
commentSchema.index({ blog: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
