import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedAdminRoute({ children, requiredRole = 'THEATRE_ADMIN' }) {
  const { isAdminAuthenticated, adminRole } = useAuth();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check if user has required role
  if (requiredRole === 'SUPERADMIN' && adminRole !== 'SUPERADMIN') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(13, 15, 30, 0.95) 0%, rgba(20, 30, 50, 0.95) 100%)',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#ff007f',
          maxWidth: '400px'
        }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Access Denied</h1>
          <p style={{ fontSize: '14px', margin: 0 }}>
            This page requires Super Admin privileges. Your current role is: <strong>{adminRole}</strong>
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export function AdminAuthGuard({ children }) {
  const { adminToken, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'rgba(13, 15, 30, 0.9)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--cyber-cyan)'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
