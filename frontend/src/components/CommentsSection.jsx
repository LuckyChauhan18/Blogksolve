import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Lock, AlertCircle, Clock, CornerDownRight, Reply, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommentsSection({ blogId, onRequireAuth }) {
  const { user, token, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
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

  // Submit top-level comment
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

  // Submit reply to a first-level comment
  const handleReplySubmit = async (parentId) => {
    if (!replyContent.trim()) return;

    if (!isAuthenticated) {
      onRequireAuth('Please log in to reply to comments.');
      return;
    }

    try {
      setReplySubmitting(true);
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: parentId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to post reply');
      }

      // Append reply to the parent comment
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId || c._id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), data.data]
            };
          }
          return c;
        })
      );

      setReplyingToId(null);
      setReplyContent('');
    } catch (err) {
      alert(err.message || 'Error posting reply');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDelete = async (commentId, parentId = null) => {
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

      if (parentId) {
        // Remove child reply
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId || c._id === parentId) {
              return {
                ...c,
                replies: (c.replies || []).filter((r) => r.id !== commentId && r._id !== commentId)
              };
            }
            return c;
          })
        );
      } else {
        // Remove top-level comment
        setComments((prev) => prev.filter((c) => c.id !== commentId && c._id !== commentId));
      }
    } catch (err) {
      alert(err.message || 'Error deleting comment');
    }
  };

  const totalCommentCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies ? c.replies.length : 0),
    0
  );

  return (
    <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          Discussion & Threaded Replies ({totalCommentCount})
        </h3>
      </div>

      {/* Primary Top-Level Comment Input */}
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
              placeholder={`Write a top-level comment as ${user?.name}...`}
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
            Want to share your feedback or reply to comments?
          </h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            You must be signed in to post comments and replies.
          </p>
          <button
            id="comment-signin-prompt-btn"
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onRequireAuth('Please sign in or register to join the conversation.')}
          >
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Comments List with 2-Level Nested Replies */}
      {loading ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Loading conversation...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', fontStyle: 'italic' }}>
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {comments.map((comment) => {
            const isAuthorOrAdmin = user && (user.id === comment.user_id || user._id === comment.user || isAdmin);
            const formattedTime = new Date(comment.createdAt || comment.created_at || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isReplying = replyingToId === (comment.id || comment._id);

            return (
              <div
                key={comment.id || comment._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* 1st Level Comment Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: comment.userRole === 'admin' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {(comment.userName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
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
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {formattedTime}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Reply Action Button */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', gap: '4px' }}
                      onClick={() => {
                        if (!isAuthenticated) {
                          onRequireAuth('Please log in to reply to this comment.');
                        } else {
                          setReplyingToId(isReplying ? null : (comment.id || comment._id));
                          setReplyContent('');
                        }
                      }}
                    >
                      <Reply size={13} />
                      <span>Reply</span>
                    </button>

                    {isAuthorOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id || comment._id)}
                        title="Delete Comment"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                <p style={{
                  color: '#e2e8f0',
                  fontSize: '0.94rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  paddingLeft: '42px'
                }}>
                  {comment.content}
                </p>

                {/* Inline Reply Form (when replying to this first-level comment) */}
                {isReplying && (
                  <div style={{
                    marginLeft: '42px',
                    marginTop: '10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CornerDownRight size={13} />
                        Replying to <strong>{comment.userName}</strong>:
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <textarea
                      id={`reply-input-${comment.id || comment._id}`}
                      rows={2}
                      className="form-textarea"
                      style={{ minHeight: '60px', padding: '8px 12px', fontSize: '0.88rem', marginBottom: '8px' }}
                      placeholder="Write your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setReplyingToId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        id={`submit-reply-btn-${comment.id || comment._id}`}
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={replySubmitting || !replyContent.trim()}
                        onClick={() => handleReplySubmit(comment.id || comment._id)}
                      >
                        <Send size={12} />
                        <span>{replySubmitting ? 'Sending...' : 'Post Reply'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2nd Level Replies Thread */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{
                    marginLeft: '42px',
                    marginTop: '8px',
                    paddingLeft: '16px',
                    borderLeft: '2px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {comment.replies.map((reply) => {
                      const isReplyAuthorOrAdmin = user && (user.id === reply.user_id || user._id === reply.user || isAdmin);
                      const replyTime = new Date(reply.createdAt || reply.created_at || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={reply.id || reply._id}
                          style={{
                            background: 'rgba(30, 41, 59, 0.45)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: reply.userRole === 'admin' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                {(reply.userName || 'U')[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {reply.userName}
                              </span>
                              {reply.userRole === 'admin' && (
                                <span className="badge" style={{
                                  background: 'rgba(236, 72, 153, 0.15)',
                                  color: '#f472b6',
                                  fontSize: '0.6rem',
                                  padding: '1px 6px'
                                }}>
                                  Admin
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                {replyTime}
                              </span>
                            </div>

                            {isReplyAuthorOrAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(reply.id || reply._id, comment.id || comment._id)}
                                title="Delete Reply"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                            {reply.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
