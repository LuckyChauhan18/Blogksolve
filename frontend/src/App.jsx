import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import BlogModal from './components/BlogModal';
import CreateBlogModal from './components/CreateBlogModal';
import AuthModal from './components/AuthModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import { Search, Sparkles, BookOpen, PenTool, RefreshCw, ShieldCheck } from 'lucide-react';

function BlogApp() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login', notice: '' });

  // Fetch approved blogs from API
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/blogs');
      const data = await res.json();
      if (data.success) {
        setBlogs(data.data);
      } else {
        throw new Error(data.message || 'Failed to load blogs');
      }
    } catch (err) {
      console.error('Fetch blogs error:', err);
      setError(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleBlogCreated = (newBlog) => {
    if (newBlog && newBlog.status === 'approved') {
      setBlogs((prev) => [newBlog, ...prev]);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({ isOpen: true, mode, notice: '' });
  };

  const handleRequireAuth = (notice) => {
    setAuthModal({ isOpen: true, mode: 'login', notice });
  };

  // Filter blogs by search term
  const filteredBlogs = blogs.filter((blog) => {
    const q = searchQuery.toLowerCase();
    return (
      blog.title.toLowerCase().includes(q) ||
      (blog.content && blog.content.toLowerCase().includes(q)) ||
      (blog.author && blog.author.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Navbar 
        onOpenCreate={() => setIsCreateOpen(true)} 
        onOpenAuth={handleOpenAuth}
        onRequireAuth={handleRequireAuth}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      <main className="container" style={{ flex: 1 }}>
        {/* Hero Header */}
        <section className="hero">
          <div className="hero-tag">
            <ShieldCheck size={14} />
            <span>Version 4.0 Milestone: Admin Approval Workflow & Dashboard</span>
          </div>
          <h1 className="hero-title">
            Words that Inspire, Code that Ships.
          </h1>
          <p className="hero-desc">
            Community-driven publishing with strict editorial oversight. User stories are submitted for <strong>Admin Review</strong> and published only once approved.
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: '560px',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-dim)',
                pointerEvents: 'none'
              }} 
            />
            <input 
              id="search-blogs-input"
              type="text" 
              className="form-input" 
              placeholder="Search approved stories by title, content or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '44px',
                paddingRight: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(17, 24, 39, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Section Heading & Refresh */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Approved Public Stories</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)' }}>
              Showing {filteredBlogs.length} approved {filteredBlogs.length === 1 ? 'story' : 'stories'}
            </p>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchBlogs}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p>Fetching approved stories...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', margin: '40px auto', maxWidth: '500px', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <h3 style={{ color: 'var(--accent-rose)', marginBottom: '8px' }}>Unable to reach backend</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={fetchBlogs}>
              Try Again
            </button>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', margin: '40px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--primary)'
            }}>
              <PenTool size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              {searchQuery ? 'No stories match your query' : 'No approved blogs yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
              {searchQuery
                ? `Try adjusting your search for "${searchQuery}" or clear the search input.`
                : 'Write a story and submit it for review to get published on the homepage!'}
            </p>
            {!searchQuery && (
              <button 
                id="empty-state-write-btn"
                className="btn btn-primary"
                onClick={() => {
                  if (isAuthenticated) {
                    setIsCreateOpen(true);
                  } else {
                    handleRequireAuth('You must sign in or register before you can write a story.');
                  }
                }}
              >
                <Sparkles size={16} />
                <span>Write a Story</span>
              </button>
            )}
          </div>
        ) : (
          <div className="blog-grid">
            {filteredBlogs.map((blog) => (
              <BlogCard 
                key={blog._id} 
                blog={blog} 
                onReadMore={(b) => setSelectedBlog(b)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 Blogksolve. Version 4.0 (Admin Approval & User Directory Dashboard).</p>
        </div>
      </footer>

      {/* Modals */}
      {selectedBlog && (
        <BlogModal 
          blog={selectedBlog} 
          onClose={() => setSelectedBlog(null)} 
          onRequireAuth={handleRequireAuth}
        />
      )}

      {isCreateOpen && (
        <CreateBlogModal 
          onClose={() => setIsCreateOpen(false)} 
          onBlogCreated={handleBlogCreated}
        />
      )}

      {isAdminDashboardOpen && (
        <AdminDashboardModal
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          onBlogApproved={fetchBlogs}
        />
      )}

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        customNotice={authModal.notice}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login', notice: '' })}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BlogApp />
    </AuthProvider>
  );
}
