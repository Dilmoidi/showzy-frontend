import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, Mail, AlertCircle, ShieldPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('All parameters are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(username, email, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Establishment protocol failed.');
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
            background: 'rgba(255, 0, 127, 0.08)',
            border: '1px solid rgba(255, 0, 127, 0.3)',
            color: 'var(--cyber-magenta)',
            marginBottom: '15px'
          }}>
            <ShieldPlus size={22} />
          </div>
          <h2 className="font-cyber" style={{ fontSize: '20px', margin: '0 0 8px 0', letterSpacing: '1px' }}>ESTABLISH IDENTITY</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Create credentials to authorize seat booking operations.
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
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>CHOOSE USERNAME</label>
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

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
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
              <Mail size={16} style={{ position: 'absolute', left: 15, top: 15, color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>SECURE PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
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
            className="cyber-btn cyber-btn-magenta font-cyber"
            style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '10px' }}
          >
            {loading ? 'ESTABLISHING PROTOCOL...' : 'ESTABLISH IDENTITY'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" state={{ from: fromPath }} style={{ color: 'var(--cyber-magenta)', textDecoration: 'none', fontWeight: 600 }}>
            Authorize Access
          </Link>
        </div>
      </div>

    </main>
  );
}
