const mongoose = require('mongoose');

// Clean, simple and understandable Schema for Blog posts (Version 4 with Approval Status)
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Blog content is required']
    },
    author: {
      type: String,
      default: 'Anonymous Writer',
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    summary: {
      type: String,
      trim: true
    },
    // Version 4 Approval Workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Auto-populate short summary from content if not provided
blogSchema.pre('save', function (next) {
  if (!this.summary && this.content) {
    this.summary = this.content.substring(0, 160).replace(/<[^>]*>?/gm, '') + '...';
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
