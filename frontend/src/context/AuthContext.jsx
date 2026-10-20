import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('blogksolve_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage or verify token
  useEffect(() => {
    const restoreUser = async () => {
      const savedToken = localStorage.getItem('blogksolve_token');
      const savedUser = localStorage.getItem('blogksolve_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);

          // Verify with backend
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
            localStorage.setItem('blogksolve_user', JSON.stringify(data.data));
          } else {
            logout();
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          logout();
        }
      }
      setLoading(false);
    };

    restoreUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setUser(data.data);
    setToken(data.data.token);
    localStorage.setItem('blogksolve_token', data.data.token);
    localStorage.setItem('blogksolve_user', JSON.stringify(data.data));
    return data.data;
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setUser(data.data);
    setToken(data.data.token);
    localStorage.setItem('blogksolve_token', data.data.token);
    localStorage.setItem('blogksolve_user', JSON.stringify(data.data));
    return data.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('blogksolve_token');
    localStorage.removeItem('blogksolve_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
