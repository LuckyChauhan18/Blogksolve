import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Lock, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommentsSection({ blogId, onRequireAuth }) {
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (blogId) {
      fetchComments();
    }
  }, [blogId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!isAuthenticated) {
      onRequireAuth('Please log in to share your thoughts in the comment section.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: content.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to post comment');
      }

      setComments((prev) => [data.data, ...prev]);
      setContent('');
    } catch (err) {
      setError(err.message || 'Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete comment');
      }

      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.message || 'Error deleting comment');
    }
  };

  return (
    <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Comment Input or Login Prompt */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--accent-rose)',
              fontSize: '0.86rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            transition: 'var(--transition-fast)'
          }}>
            <textarea
              id="comment-input"
              rows={3}
              placeholder={`Write a thoughtful comment as ${user?.name}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                resize: 'none',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Commenting as <strong>{user?.name}</strong> ({user?.role})
              </span>
              <button
                id="submit-comment-btn"
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting || !content.trim()}
              >
                <Send size={13} />
                <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px dashed rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <Lock size={22} style={{ color: '#a5b4fc', margin: '0 auto 8px' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            Want to share your feedback or ask questions?
          </h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            You must be logged in to participate in the comments.
          </p>
          <button
            id="comment-signin-prompt-btn"
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onRequireAuth('Please sign in or register to post a comment.')}
          >
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Loading conversation...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', fontStyle: 'italic' }}>
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map((comment) => {
            const isAuthorOrAdmin = user && (user._id === comment.user || isAdmin);
            const formattedTime = new Date(comment.createdAt || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={comment._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: comment.userRole === 'admin' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {(comment.userName || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {comment.userName}
                    </span>
                    {comment.userRole === 'admin' && (
                      <span className="badge" style={{
                        background: 'rgba(236, 72, 153, 0.15)',
                        color: '#f472b6',
                        fontSize: '0.65rem',
                        padding: '2px 8px'
                      }}>
                        Admin
                      </span>
                    )}
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {formattedTime}
                    </span>
                  </div>

                  {isAuthorOrAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment._id)}
                      title="Delete Comment"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p style={{
                  color: '#cbd5e1',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  paddingLeft: '38px'
                }}>
                  {comment.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
