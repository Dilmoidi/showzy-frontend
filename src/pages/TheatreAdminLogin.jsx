import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, KeyRound, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TheatreAdminLogin() {
  const navigate = useNavigate();
  const { theatreAdminLogin, isAdminAuthenticated } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate, isAdminAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await theatreAdminLogin(username, password);

      setSuccess('✓ Access granted. Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 800);

    } catch (err) {
      setError(err.message || 'Access denied. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div className="theatre-admin-login" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(13, 15, 30, 0.95) 0%, rgba(20, 30, 50, 0.95) 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 242, 254, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-50px',
        left: '-50px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255, 0, 127, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '50px',
        right: '-50px',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '45px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.12)',
            border: '2px solid rgba(0, 242, 254, 0.4)',
            color: 'var(--cyber-cyan)',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
          }}>
            <Building2 size={28} />
          </div>

          <h1 className="font-cyber" style={{
            fontSize: '28px',
            margin: '0 0 10px 0',
            letterSpacing: '2px',
            color: 'white',
            textShadow: '0 0 10px rgba(0, 242, 254, 0.3)'
          }}>
            THEATRE ADMIN
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: 0,
            letterSpacing: '1px'
          }}>
            Management Console Access
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{
          padding: '40px',
          background: 'rgba(13, 15, 30, 0.8)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 242, 254, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 0, 127, 0.12)',
              border: '1px solid rgba(255, 0, 127, 0.4)',
              color: '#ff007f',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Username Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Admin Username
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    '::placeholder': {
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.2)'}
                />
                <Building2 size={16} style={{
                  position: 'absolute',
                  left: '14px',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Access Password
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0, 242, 254, 0.2)'}
                />
                <KeyRound size={16} style={{
                  position: 'absolute',
                  left: '14px',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none'
                }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px 8px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--cyber-cyan)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="cyber-btn font-cyber"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  AUTHENTICATING...
                </>
              ) : (
                'GRANT ACCESS'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(0, 242, 254, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              margin: '0 0 12px 0'
            }}>
              Demo Credentials Available
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--cyber-cyan)',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 242, 254, 0.2)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 242, 254, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Load Demo Credentials
            </button>
          </div>
        </div>

        {/* Links */}
        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          fontSize: '13px'
        }}>
          <Link to="/login" style={{
            color: 'var(--cyber-cyan)',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
            ← Back to User Login
          </Link>
          <span style={{ color: 'var(--text-secondary)', margin: '0 12px' }}>•</span>
          <Link to="/" style={{
            color: 'var(--cyber-cyan)',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
            Go to Home →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
