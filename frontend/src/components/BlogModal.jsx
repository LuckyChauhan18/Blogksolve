import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import CommentsSection from './CommentsSection';
import API_URL from '../config/api';

export default function BlogModal({ blog, onClose, onRequireAuth }) {
  if (!blog) return null;

  const wordCount = blog.content ? blog.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));
  const formattedDate = new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const imageUrl = blog.coverImage 
    ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${API_URL}${blog.coverImage}`)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', padding: '36px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700
            }}>
              {(blog.author || 'A')[0].toUpperCase()}
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                {blog.author || 'Anonymous'}
              </h4>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {formattedDate}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {readTime} min read
                </span>
              </div>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Cover Image — 16:9 widescreen banner, perfectly balanced with content */}
        {imageUrl && (
          <div style={{
            width: '100%',
            aspectRatio: '16 / 9',
            maxHeight: '300px',
            borderRadius: '14px',
            overflow: 'hidden',
            margin: '18px 0 24px 0',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.7)'
          }}>
            <img
              src={imageUrl}
              alt={blog.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block'
              }}
            />
          </div>
        )}

        <h1 style={{ fontSize: '2.2rem', marginBottom: '20px', lineHeight: '1.25' }}>
          {blog.title}
        </h1>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          color: '#cbd5e1',
          fontSize: '1.05rem',
          lineHeight: '1.8',
          whiteSpace: 'pre-wrap',
          marginBottom: '20px'
        }}>
          {blog.content}
        </div>

        {/* Embedded Comments Section */}
        <CommentsSection blogId={blog._id} onRequireAuth={onRequireAuth} />

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          marginTop: '28px'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Article
          </button>
        </div>
      </div>
    </div>
  );
}
