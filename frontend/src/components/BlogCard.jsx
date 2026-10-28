import React from 'react';
import { Calendar, User, ArrowRight, Clock, Tag, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

export default function BlogCard({ blog, onReadMore, onSelectTag, onEditBlog, onDeleteBlog }) {
  const { user, isAdmin } = useAuth();

  const wordCount = blog.content ? blog.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  const formattedDate = new Date(blog.createdAt || blog.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isAuthor = user && (user.id === blog.user_id || user._id === blog.user_id);
  const canModify = isAuthor || isAdmin;

  const tags = Array.isArray(blog.tags) ? blog.tags : [];

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Author Bar with Edit/Delete for authorized users */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            {(blog.author || 'A')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{blog.author || 'Anonymous'}</span>
          </div>
        </div>

        {canModify && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {onEditBlog && (
              <button
                type="button"
                onClick={() => onEditBlog(blog)}
                title="Edit Story"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem'
                }}
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            )}

            {onDeleteBlog && (
              <button
                type="button"
                onClick={() => onDeleteBlog(blog.id || blog._id)}
                title="Delete Story"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-rose)',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem'
                }}
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cover Image — 16:9 standard card banner */}
      {blog.coverImage && (
        <div style={{
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight: '210px',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          marginBottom: '14px',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <img
            src={blog.coverImage.startsWith('http') ? blog.coverImage : `${API_URL}${blog.coverImage}`}
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

      <h3 style={{ fontSize: '1.35rem', marginBottom: '10px', lineHeight: '1.35' }}>
        {blog.title}
      </h3>

      {/* Tags Chips */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {tags.map((t, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectTag) onSelectTag(t);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'var(--transition-fast)'
              }}
            >
              <Tag size={10} />
              <span>#{t}</span>
            </span>
          ))}
        </div>
      )}

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.94rem',
        marginBottom: '20px',
        flexGrow: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {blog.summary || blog.content}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.82rem',
        color: 'var(--text-dim)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            {formattedDate}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {readTime} min read
          </span>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => onReadMore(blog)}
          style={{ gap: '4px' }}
        >
          <span>Read</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </article>
  );
}
