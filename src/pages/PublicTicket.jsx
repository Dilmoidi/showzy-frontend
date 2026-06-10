import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Download, AlertTriangle, ArrowRight, ShieldAlert, Film, Calendar, Clock, MapPin, Armchair } from 'lucide-react';

export default function PublicTicket() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const { API_BASE } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicTicket = async () => {
      try {
        const url = `${API_BASE}/ticket/${bookingId}/?token=${tokenParam}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setBooking(data);
        } else {
          if (response.status === 403) {
            setError('Access Denied: Invalid security signature key.');
          } else {
            setError('Ticket record not found or expired.');
          }
        }
      } catch (e) {
        setError('Network interface connection failed.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchPublicTicket();
    }
  }, [bookingId, tokenParam]);

  const handleDownloadPDF = () => {
    if (!booking) return;
    window.open(`${API_BASE}/download-ticket/${booking.booking_id || booking.id}/`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(0, 242, 254, 0.1)',
          borderTopColor: 'var(--cyber-cyan)',
          animation: 'spin 1s linear infinite'
        }} />
        <span className="font-cyber text-glow-cyan" style={{ fontSize: '14px', letterSpacing: '2px' }}>
          DECRYPTING TICKET CONFIGURATION...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <main style={{ padding: '80px 20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px 30px', border: '1px solid rgba(255, 0, 127, 0.3)', borderRadius: '24px', boxShadow: '0 0 30px rgba(255,0,127,0.15)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 0, 127, 0.1)',
            border: '2px solid var(--cyber-magenta)',
            color: 'var(--cyber-magenta)',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-cyber text-glow-magenta" style={{ fontSize: '22px', margin: '0 0 15px 0', letterSpacing: '1px' }}>
            DECRYPTION FAILURE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 30px 0' }}>
            {error || 'The requested ticket matrix signal is invalid or unavailable.'}
          </p>
          <Link to="/" className="cyber-btn cyber-btn-magenta" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
            Return to Core Portal
          </Link>
        </div>
      </main>
    );
  }

  const show = booking.show_details || {};
  const isCheckedIn = booking.is_checked_in;

  return (
    <main style={{ padding: '40px 20px 80px 20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Decoded Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div className="font-cyber" style={{ fontSize: '10px', color: 'var(--cyber-cyan)', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
          // CYBER-TICKET DECRYPTED //
        </div>
        <h1 className="font-cyber text-glow-cyan" style={{ fontSize: '24px', margin: 0, fontWeight: 900 }}>
          SHOWZY ENTRY PERMIT
        </h1>
      </div>

      {/* Main Cyber Ticket Component */}
      <div className="ticket-cyber scanline-effect" style={{
        marginBottom: '40px',
        boxShadow: isCheckedIn ? '0 0 30px rgba(255, 179, 0, 0.2)' : '0 0 30px rgba(212, 175, 55, 0.25)',
        borderColor: isCheckedIn ? 'var(--cyber-magenta)' : 'var(--cyber-cyan)'
      }}>
        
        {/* Ticket Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div>
            <span className="font-cyber" style={{ fontSize: '10px', color: isCheckedIn ? 'var(--cyber-magenta)' : 'var(--cyber-cyan)', letterSpacing: '2px' }}>
              ENTRY MATRIX SIGNAL
            </span>
            <h2 style={{ fontSize: '22px', margin: '5px 0 0 0', color: 'white', fontWeight: 800, lineHeight: 1.2 }}>
              {show.movie_title}
            </h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {show.language} &bull; {show.cinema_name}
            </p>
          </div>
          
          <div className="font-cyber" style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>BOOKING ID</span>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
              #SZ-{booking.booking_id ? booking.booking_id.substring(0, 8).toUpperCase() : booking.id}
            </div>
          </div>
        </div>

        <div className="ticket-divider" style={{ borderColor: isCheckedIn ? 'rgba(255, 179, 0, 0.2)' : 'rgba(212, 175, 55, 0.3)' }} />

        {/* Ticket Details Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px 15px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Calendar size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>SHOW DATE</div>
              <strong style={{ color: 'white', fontSize: '13px' }}>
                {new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Clock size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>SHOW TIME</div>
              <strong style={{ color: 'white', fontSize: '13px' }}>
                {show.start_time ? show.start_time.substring(0, 5) : ''}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <MapPin size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>THEATRE SCREEN</div>
              <strong style={{ color: 'white', fontSize: '13px' }}>
                {show.screen_name}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Armchair size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>SEAT MATRIX</div>
              <strong className="font-cyber" style={{ color: 'var(--cyber-cyan)', fontSize: '14px', fontWeight: 'bold' }}>
                {booking.seats ? booking.seats.join(', ') : ''}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Film size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>USER ALIAS</div>
              <strong style={{ color: 'white', fontSize: '13px' }}>
                {booking.user_name || 'Anonymous User'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Ticket size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>VERIFICATION STATUS</div>
              {isCheckedIn ? (
                <span className="font-cyber text-glow-magenta" style={{ fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  CHECKED IN
                </span>
              ) : (
                <span className="font-cyber" style={{ color: '#00ff66', textShadow: '0 0 8px rgba(0,255,102,0.4)', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ACTIVE PERMIT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barcode Overlay */}
        <div style={{ marginTop: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{
            height: '40px',
            width: '100%',
            background: 'repeating-linear-gradient(90deg, #fff, #fff 2px, transparent 2px, transparent 8px, #fff 8px, #fff 11px, transparent 11px, transparent 15px)',
            opacity: 0.12
          }} />
          <span className="font-cyber" style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '4px' }}>
            {booking.booking_id ? booking.booking_id.toUpperCase() : 'TRANSACTION_CONFIRMED'}
          </span>
        </div>

      </div>

      {/* Actions Section */}
      <div style={{ display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={handleDownloadPDF}
          className="cyber-btn cyber-btn-cyan"
          style={{ width: '100%', padding: '12px 24px', fontSize: '14px', justifyContent: 'center' }}
        >
          <Download size={18} />
          Download PDF Ticket
        </button>

        <Link 
          to="/"
          className="cyber-btn"
          style={{ width: '100%', padding: '12px 24px', fontSize: '14px', justifyContent: 'center', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Book More Tickets
          <ArrowRight size={16} />
        </Link>
      </div>

    </main>
  );
}
