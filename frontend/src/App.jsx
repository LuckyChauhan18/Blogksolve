import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import BlogModal from './components/BlogModal';
import CreateBlogModal from './components/CreateBlogModal';
import { Search, Sparkles, BookOpen, PenTool, RefreshCw } from 'lucide-react';

export default function App() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch blogs from API
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
    setBlogs((prev) => [newBlog, ...prev]);
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
        blogCount={blogs.length}
      />

      <main className="container" style={{ flex: 1 }}>
        {/* Hero Header */}
        <section className="hero">
          <div className="hero-tag">
            <Sparkles size={14} />
            <span>Version 1.0 Milestone: Core Blog Engine</span>
          </div>
          <h1 className="hero-title">
            Words that Inspire, Code that Ships.
          </h1>
          <p className="hero-desc">
            A minimalist, high-performance publishing space powered by Express.js and MongoDB. Read stories, write drafts, and explore ideas freely.
          </p>

          {/* Search bar & Quick Stats */}
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
              placeholder="Search stories by title, content or author..."
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
            <h2 style={{ fontSize: '1.4rem' }}>Latest Published Stories</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)' }}>
              Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'story' : 'stories'}
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
            <p>Fetching stories from MongoDB...</p>
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
              {searchQuery ? 'No stories match your query' : 'No blogs published yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 24px', fontSize: '0.92rem' }}>
              {searchQuery
                ? `Try adjusting your search for "${searchQuery}" or clear the search input.`
                : 'Be the first writer to publish an insightful story on the platform!'}
            </p>
            {!searchQuery && (
              <button 
                id="empty-state-write-btn"
                className="btn btn-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Sparkles size={16} />
                <span>Write the First Story</span>
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
          <p>© 2026 Blogksolve. Version 1.0 (MongoDB + Express + React).</p>
        </div>
      </footer>

      {/* Modals */}
      {selectedBlog && (
        <BlogModal 
          blog={selectedBlog} 
          onClose={() => setSelectedBlog(null)} 
        />
      )}

      {isCreateOpen && (
        <CreateBlogModal 
          onClose={() => setIsCreateOpen(false)} 
          onBlogCreated={handleBlogCreated}
        />
      )}
    </>
  );
}
