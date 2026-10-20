import React from 'react';
import { PenSquare, BookOpen, LogIn, UserPlus, LogOut, Shield, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenCreate, onOpenAuth, onRequireAuth, onOpenAdminDashboard }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleWriteClick = () => {
    if (isAuthenticated) {
      onOpenCreate();
    } else {
      onRequireAuth('You must sign in or register before you can write a story.');
    }
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="brand-title">Blogksolve</span>
            <span className="badge badge-version" style={{ marginLeft: '10px' }}>
              v4.0 Admin Approval
            </span>
          </div>
        </div>

        <div className="nav-actions">
          {/* Admin Dashboard trigger for admin users */}
          {isAuthenticated && isAdmin && (
            <button
              id="admin-dashboard-btn"
              className="btn btn-secondary"
              onClick={onOpenAdminDashboard}
              style={{
                borderColor: 'rgba(236, 72, 153, 0.5)',
                background: 'rgba(236, 72, 153, 0.1)',
                color: '#f472b6'
              }}
            >
              <ShieldAlert size={16} />
              <span>Admin Dashboard</span>
            </button>
          )}

          <button 
            id="nav-write-btn"
            className="btn btn-primary"
            onClick={handleWriteClick}
          >
            <PenSquare size={17} />
            <span>Write Story</span>
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '4px 12px 4px 6px',
                borderRadius: 'var(--radius-full)'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    {user.name}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isAdmin ? '#f472b6' : '#a5b4fc',
                    letterSpacing: '0.5px'
                  }}>
                    {isAdmin ? '🛡️ Admin' : '👤 Member'}
                  </span>
                </div>
              </div>

              <button 
                id="logout-btn"
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Log out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                id="login-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth('login')}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button 
                id="register-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth('register')}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
