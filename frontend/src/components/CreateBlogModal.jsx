import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreateBlogModal({ onClose, onBlogCreated }) {
  const { user, token } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a Title and Content for your story.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/blogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          author: user?.name || 'Anonymous'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish blog post');
      }

      onBlogCreated(data.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating blog');
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
              <h3 style={{ fontSize: '1.25rem' }}>Write New Story</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Publishing as <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'User'}</strong> ({user?.role?.toUpperCase() || 'MEMBER'})
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
              placeholder="e.g. Scaling Authentication Systems with JWT & Express"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Author</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid var(--border-color)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '0.92rem'
            }}>
              <User size={16} />
              <span>{user?.name} ({user?.email})</span>
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
              <span>{loading ? 'Publishing...' : 'Publish Story'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
