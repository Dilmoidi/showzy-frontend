import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, AlertCircle, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Path to redirect back to (e.g. if they came from picking seats)
  const fromPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both identity keys.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Identity verification failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        background: 'rgba(13, 15, 30, 0.7)'
      }}>
        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45px',
            height: '45px',
            borderRadius: '10px',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            color: 'var(--cyber-cyan)',
            marginBottom: '15px'
          }}>
            <ShieldAlert size={22} />
          </div>
          <h2 className="font-cyber" style={{ fontSize: '20px', margin: '0 0 8px 0', letterSpacing: '1px' }}>SYSTEM LOGIN</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Submit credentials to authorize seat booking protocols.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 0, 127, 0.1)',
            border: '1px solid var(--cyber-magenta)',
            color: 'var(--cyber-magenta)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>IDENTITY USERNAME</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <User size={16} style={{ position: 'absolute', left: 15, top: 15, color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ACCESS PASSWORD</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <KeyRound size={16} style={{ position: 'absolute', left: 15, top: 15, color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="cyber-btn font-cyber"
            style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '10px' }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          New operator?{' '}
          <Link to="/register" state={{ from: fromPath }} style={{ color: 'var(--cyber-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Establish Identity
          </Link>
        </div>
      </div>

    </main>
  );
}
