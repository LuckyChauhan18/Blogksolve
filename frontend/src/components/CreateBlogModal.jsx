import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle, User, Clock, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

export default function CreateBlogModal({ onClose, onBlogCreated, initialBlog = null, onBlogUpdated }) {
  const { user, token, isAdmin } = useAuth();
  const [title, setTitle] = useState(initialBlog?.title || '');
  const [content, setContent] = useState(initialBlog?.content || '');
  const [coverImage, setCoverImage] = useState(null);
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(initialBlog?.tags) ? initialBlog.tags.join(', ') : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(null);

  const isEditing = !!initialBlog;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a Title and Content for your story.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const cleanTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const url = isEditing 
        ? `${API_URL}/api/blogs/${initialBlog.id || initialBlog._id}` 
        : `${API_URL}/api/blogs`;

      const method = isEditing ? 'PUT' : 'POST';

      // Use FormData for file upload support
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('author', user?.name || 'Anonymous');
      formData.append('tags', cleanTags.join(','));
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save blog post');
      }

      if (isEditing) {
        if (onBlogUpdated) onBlogUpdated(data.data);
        onClose();
      } else {
        if (data.status === 'pending') {
          setSubmittedNotice({
            status: 'pending',
            message: data.message
          });
        } else {
          onBlogCreated(data.data);
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Error saving blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>
                {isEditing ? 'Edit Story' : 'Write New Story'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                {isEditing ? 'Update your published content' : `Publishing as ${user?.name || 'User'} (${user?.role?.toUpperCase() || 'MEMBER'})`}
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {submittedNotice ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '8px', color: 'var(--text-main)' }}>
              Submitted for Admin Approval!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              Your story has been received into PostgreSQL. Normal member stories are held in review and will appear publicly once an Administrator approves them from the Admin Dashboard.
            </p>
            <button 
              id="close-pending-notice-btn"
              type="button" 
              className="btn btn-primary"
              onClick={onClose}
            >
              Got it, thanks!
            </button>
          </div>
        ) : (
          <>
            {!isAdmin && !isEditing && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fde68a',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <Clock size={15} />
                <span>Notice: Stories submitted by normal members require Admin approval before public release.</span>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--accent-rose)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Story Title *</label>
                <input 
                  id="blog-title-input"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Relational Data Modeling with PostgreSQL and Express"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>(Optional)</span></label>
                <input
                  id="blog-cover-image-input"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  style={{ cursor: 'pointer', paddingTop: '8px' }}
                  onChange={(e) => setCoverImage(e.target.files[0] || null)}
                />
                {coverImage && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 9',
                      maxHeight: '180px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      marginBottom: '6px',
                      background: 'rgba(15, 23, 42, 0.7)'
                    }}>
                      <img 
                        src={URL.createObjectURL(coverImage)} 
                        alt="Preview" 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block'
                        }} 
                      />
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Remove image"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ✅ Selected: <strong>{coverImage.name}</strong> ({(coverImage.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Story Tags (comma separated)</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                  <input 
                    id="blog-tags-input"
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }}
                    placeholder="e.g. PostgreSQL, Backend, Architecture, React"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Story Content *</label>
                <textarea 
                  id="blog-content-input"
                  className="form-textarea" 
                  placeholder="Write your story or technical article here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  id="submit-blog-btn"
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <Send size={15} />
                  <span>
                    {loading 
                      ? 'Saving...' 
                      : isEditing 
                        ? 'Update Story' 
                        : isAdmin 
                          ? 'Publish Immediately' 
                          : 'Submit for Review'}
                  </span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
