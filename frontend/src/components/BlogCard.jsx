import React from 'react';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

export default function BlogCard({ blog, onReadMore }) {
  // Approximate read time based on word count
  const wordCount = blog.content ? blog.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  const formattedDate = new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a5b4fc'
        }}>
          <User size={16} />
        </div>
        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{blog.author || 'Anonymous'}</span>
        </div>
      </div>

      <h3 style={{ fontSize: '1.35rem', marginBottom: '12px', lineHeight: '1.35' }}>
        {blog.title}
      </h3>

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
