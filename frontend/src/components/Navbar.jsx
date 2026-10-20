import React from 'react';
import { PenSquare, BookOpen } from 'lucide-react';

export default function Navbar({ onOpenCreate, blogCount }) {
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
              v1.0 MongoDB
            </span>
          </div>
        </div>

        <div className="nav-actions">
          <button 
            id="nav-write-btn"
            className="btn btn-primary"
            onClick={onOpenCreate}
          >
            <PenSquare size={17} />
            <span>Write Story</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
