import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import BlogModal from './components/BlogModal';
import CreateBlogModal from './components/CreateBlogModal';
import AuthModal from './components/AuthModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import { Search, Sparkles, PenTool, RefreshCw, Database, Tag, Layers } from 'lucide-react';

function BlogApp() {
  const { isAuthenticated, user, token, isAdmin } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login', notice: '' });

  // Fetch blogs & tags from PostgreSQL API
  const fetchBlogs = async (tag = selectedTag) => {
    try {
      setLoading(true);
      setError(null);
      const url = tag ? `http://localhost:5000/api/blogs?tag=${encodeURIComponent(tag)}` : 'http://localhost:5000/api/blogs';
      const [res, tagsRes] = await Promise.all([
        fetch(url),
        fetch('http://localhost:5000/api/blogs/tags/all')
      ]);

      const data = await res.json();
      const tagsData = await tagsRes.json();

      if (data.success) {
        setBlogs(data.data);
      } else {
        throw new Error(data.message || 'Failed to load blogs');
      }

      if (tagsData.success) {
        setPopularTags(tagsData.data);
      }
    } catch (err) {
      console.error('Fetch blogs error:', err);
      setError(err.message || 'Could not connect to PostgreSQL backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(selectedTag);
  }, [selectedTag]);

  const handleBlogCreated = (newBlog) => {
    if (newBlog && newBlog.status === 'approved') {
      setBlogs((prev) => [newBlog, ...prev]);
    }
  };

  const handleBlogUpdated = (updatedBlog) => {
    setBlogs((prev) =>
      prev.map((b) => ((b.id || b._id) === (updatedBlog.id || updatedBlog._id) ? updatedBlog : b))
    );
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete blog');
      setBlogs((prev) => prev.filter((b) => (b.id || b._id) !== blogId));
    } catch (err) {
      alert(err.message || 'Error deleting story');
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({ isOpen: true, mode, notice: '' });
  };

  const handleRequireAuth = (notice) => {
    setAuthModal({ isOpen: true, mode: 'login', notice });
  };

  // Filter blogs by search query
  const filteredBlogs = blogs.filter((blog) => {
    const q = searchQuery.toLowerCase();
    const hasTagMatch = Array.isArray(blog.tags) && blog.tags.some((t) => t.toLowerCase().includes(q));
    return (
      blog.title.toLowerCase().includes(q) ||
      (blog.content && blog.content.toLowerCase().includes(q)) ||
      (blog.author && blog.author.toLowerCase().includes(q)) ||
      hasTagMatch
    );
  });

  return (
    <>
      <Navbar 
        onOpenCreate={() => {
          setEditingBlog(null);
          setIsCreateOpen(true);
        }} 
        onOpenAuth={handleOpenAuth}
        onRequireAuth={handleRequireAuth}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      <main className="container" style={{ flex: 1 }}>
        {/* Hero Header */}
        <section className="hero">
          <div className="hero-tag" style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
            <Database size={14} />
            <span>Version 5.0 (Final): PostgreSQL Engine + Tags + Threaded Nested Comments</span>
          </div>
          <h1 className="hero-title">
            Words that Inspire, Code that Ships.
          </h1>
          <p className="hero-desc">
            Full-stack publication platform built on <strong>Express</strong>, <strong>PostgreSQL</strong>, and <strong>React</strong>. Features relational tagging, two-tier threaded reply discussions, and editorial review approval.
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: '560px',
            margin: '0 auto 20px',
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
              placeholder="Search stories by title, content, author, or tag..."
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

          {/* Interactive Tags Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            maxWidth: '750px',
            margin: '0 auto'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={13} />
              Filter by Tag:
            </span>

            <button
              type="button"
              id="filter-tag-all"
              onClick={() => setSelectedTag('')}
              style={{
                background: selectedTag === '' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedTag === '' ? 'white' : 'var(--text-muted)',
                border: `1px solid ${selectedTag === '' ? 'transparent' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              All Topics
            </button>

            {popularTags.map((t) => {
              const active = selectedTag.toLowerCase() === t.name.toLowerCase();
              return (
                <button
                  key={t.id}
                  id={`filter-tag-${t.name}`}
                  type="button"
                  onClick={() => setSelectedTag(active ? '' : t.name)}
                  style={{
                    background: active ? 'var(--primary-gradient)' : 'rgba(99, 102, 241, 0.1)',
                    color: active ? 'white' : '#a5b4fc',
                    border: `1px solid ${active ? 'transparent' : 'rgba(99, 102, 241, 0.25)'}`,
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  #{t.name} ({t.count})
                </button>
              );
            })}
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
            <h2 style={{ fontSize: '1.4rem' }}>
              {selectedTag ? `Stories tagged #${selectedTag}` : 'Public Stories (PostgreSQL)'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)' }}>
              Showing {filteredBlogs.length} approved {filteredBlogs.length === 1 ? 'story' : 'stories'}
            </p>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => fetchBlogs(selectedTag)}
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
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p>Fetching stories from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', margin: '40px auto', maxWidth: '500px', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <h3 style={{ color: 'var(--accent-rose)', marginBottom: '8px' }}>Unable to reach backend</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={() => fetchBlogs(selectedTag)}>
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
              {selectedTag ? `No stories found with tag #${selectedTag}` : searchQuery ? 'No stories match your search' : 'No approved blogs yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
              {selectedTag 
                ? 'Try picking a different tag filter or click "All Topics".'
                : 'Write a story and submit it for review to get published on the homepage!'}
            </p>
            {selectedTag ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTag('')}>
                Clear Tag Filter
              </button>
            ) : (
              <button 
                id="empty-state-write-btn"
                className="btn btn-primary"
                onClick={() => {
                  if (isAuthenticated) {
                    setEditingBlog(null);
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
                key={blog.id || blog._id} 
                blog={blog} 
                onReadMore={(b) => setSelectedBlog(b)}
                onSelectTag={(t) => setSelectedTag(t)}
                onEditBlog={(b) => {
                  setEditingBlog(b);
                  setIsCreateOpen(true);
                }}
                onDeleteBlog={handleDeleteBlog}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2026 Blogksolve. Version 5.0 (Express + PostgreSQL + React + Tags + Threaded Replies).</p>
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
          initialBlog={editingBlog}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingBlog(null);
          }} 
          onBlogCreated={handleBlogCreated}
          onBlogUpdated={handleBlogUpdated}
        />
      )}

      {isAdminDashboardOpen && (
        <AdminDashboardModal
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          onBlogApproved={() => fetchBlogs(selectedTag)}
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
