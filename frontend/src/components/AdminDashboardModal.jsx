import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Clock, Users, FileText, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

export default function AdminDashboardModal({ isOpen, onClose, onBlogApproved }) {
  if (!isOpen) return null;

  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'fulfilled', 'users'
  const [blogsData, setBlogsData] = useState({ pendingBlogs: [], fulfilledBlogs: [], pendingCount: 0, fulfilledCount: 0 });
  const [usersData, setUsersData] = useState({ requestedUsers: [], fulfilledUsers: [], allUsers: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notice, setNotice] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [blogsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/blogs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const bData = await blogsRes.json();
      const uData = await usersRes.json();

      if (bData.success) setBlogsData(bData.data);
      if (uData.success) setUsersData(uData.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDecision = async (blogId, status) => {
    try {
      setActionLoadingId(blogId);
      const res = await fetch(`${API_URL}/api/admin/blogs/${blogId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setNotice(`Blog request ${status === 'approved' ? 'ACCEPTED & Made Public!' : 'DECLINED'}`);
      setTimeout(() => setNotice(''), 3000);

      // Refresh data
      await fetchAdminData();
      if (status === 'approved' && onBlogApproved) {
        onBlogApproved();
      }
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '960px', padding: '32px', maxHeight: '90vh' }}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <h2 style={{ fontSize: '1.45rem' }}>Admin Control & Review Dashboard</h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Review story submissions, accept/decline publication requests, and inspect user directory.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-secondary btn-sm" onClick={fetchAdminData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {notice && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            color: 'var(--accent-emerald)',
            fontSize: '0.88rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock size={16} />
            <span>Pending Requests</span>
            <span className="badge" style={{
              background: blogsData.pendingCount > 0 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.08)',
              color: blogsData.pendingCount > 0 ? '#f472b6' : 'var(--text-dim)',
              fontSize: '0.72rem'
            }}>
              {blogsData.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fulfilled')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              color: activeTab === 'fulfilled' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'fulfilled' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Fulfilled Requests History ({blogsData.fulfilledCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={16} />
            <span>User Directory ({usersData.allUsers.length})</span>
          </button>
        </div>

        {/* Tab 1: Pending Requests */}
        {activeTab === 'pending' && (
          <div>
            {blogsData.pendingBlogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px' }} />
                <h4 style={{ color: 'var(--text-main)', marginBottom: '4px' }}>All caught up!</h4>
                <p style={{ fontSize: '0.88rem' }}>There are no pending blog publication requests waiting for approval.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {blogsData.pendingBlogs.map((b) => (
                  <div 
                    key={b._id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem' }}>
                            ⏳ PENDING APPROVAL
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                            Submitted by <strong>{b.author}</strong> ({b.user?.email || 'N/A'})
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{b.title}</h3>
                      </div>

                      {/* Accept & Decline Buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          id={`accept-btn-${b._id}`}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                          }}
                          onClick={() => handleDecision(b._id, 'approved')}
                          disabled={actionLoadingId === b._id}
                        >
                          <Check size={14} />
                          <span>Accept (Approve)</span>
                        </button>
                        <button
                          id={`decline-btn-${b._id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDecision(b._id, 'declined')}
                          disabled={actionLoadingId === b._id}
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                      {b.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fulfilled Requests History */}
        {activeTab === 'fulfilled' && (
          <div>
            {blogsData.fulfilledBlogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                No fulfilled history yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {blogsData.fulfilledBlogs.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge" style={{
                          background: b.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: b.status === 'approved' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          fontSize: '0.72rem'
                        }}>
                          {b.status === 'approved' ? '✓ APPROVED (PUBLIC)' : '✗ DECLINED'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          Author: {b.author}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{b.title}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {b.status === 'declined' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDecision(b._id, 'approved')}
                          disabled={actionLoadingId === b._id}
                        >
                          Re-approve
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDecision(b._id, 'declined')}
                          disabled={actionLoadingId === b._id}
                        >
                          Revoke to Declined
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: User Directory */}
        {activeTab === 'users' && (
          <div>
            {/* Summary statistics bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>
                  {usersData.requestedUsersCount}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users with Pending Requests</p>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {usersData.fulfilledUsersCount}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fulfilled Request Users</p>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {usersData.totalUsers}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Registered Users</p>
              </div>
            </div>

            {/* User List Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {usersData.allUsers.map((u) => (
                <div
                  key={u._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: u.role === 'admin' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}>
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</span>
                        <span className="badge" style={{
                          background: u.role === 'admin' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: u.role === 'admin' ? '#f472b6' : '#a5b4fc',
                          fontSize: '0.65rem'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{u.email}</span>
                    </div>
                  </div>

                  {/* User status tags & counts */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.pendingCount > 0 ? (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem' }}>
                        ⚡ {u.pendingCount} Pending Request(s)
                      </span>
                    ) : u.hasFulfilledRequest ? (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>
                        ✓ Fulfilled ({u.approvedCount} approved, {u.declinedCount} declined)
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        No submissions yet
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
