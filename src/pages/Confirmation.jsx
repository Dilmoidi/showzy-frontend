import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Ticket, Printer, Home as HomeIcon, Download, Share2, Copy } from 'lucide-react';

export default function Confirmation() {
  const { bookingId } = useParams();
  const location = useLocation();
  const { token, API_BASE } = useAuth();
  
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyBookingId = () => {
    if (booking?.booking_id) {
      navigator.clipboard.writeText(booking.booking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch booking details if not available in state
  useEffect(() => {
    const fetchConfirmedBooking = async () => {
      if (booking) return;
      try {
        const response = await fetch(`${API_BASE}/bookings/user/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (response.ok) {
          const bookings = await response.json();
          const target = bookings.find(b => b.id == bookingId);
          if (target && target.booking_status === 'CONFIRMED') {
            setBooking(target);
          } else {
            setError('Confirmed booking record not found.');
          }
        } else {
          setError('Failed to query system bookings.');
        }
      } catch (e) {
        setError('Network error validating ticket.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchConfirmedBooking();
    }
  }, [bookingId, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber text-glow-cyan">GENERATING CYBER-TICKET ENVELOPE...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--cyber-magenta)' }}>{error || 'Invalid session'}</h2>
        <Link to="/" className="cyber-btn cyber-btn-cyan" style={{ marginTop: '20px' }}>Return to Base</Link>
      </div>
    );
  }

  const show = booking.show_details || {};
  
  // Use backend generated QR base64 image or fall back to external generator
  const qrCodeUrl = booking.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=00f2fe&bgcolor=06070d&data=${encodeURIComponent(JSON.stringify({ booking_id: booking.booking_id, token: booking.qr_token }))}`;

  const handleDownloadPDF = () => {
    window.open(`${API_BASE}/download-ticket/${booking.booking_id || booking.id}/`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = `Hey! I just booked tickets for "${show.movie_title}" at ${show.cinema_name}.\nSeats: ${booking.seats.join(', ')}\nShowtime: ${new Date(show.date).toLocaleDateString()} at ${show.start_time.substring(0, 5)}\nBooking ID: #SZ-${booking.booking_id ? booking.booking_id.substring(0, 8).toUpperCase() : booking.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <main style={{ padding: '0 20px 50px 20px', maxWidth: '750px', margin: '0 auto' }}>
      
      {/* Success Banner */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(0, 242, 254, 0.1)',
          border: '2px solid var(--cyber-cyan)',
          color: 'var(--cyber-cyan)',
          marginBottom: '15px',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
        }}>
          <Check size={32} />
        </div>
        <h1 className="font-cyber text-glow-cyan" style={{ fontSize: '28px', margin: '0 0 10px 0', letterSpacing: '1px' }}>
          BROADCAST SECURED
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
          Your seat matrix has been successfully reserved. Signal configuration is verified.
        </p>
      </div>

      {/* Cyber Ticket */}
      <div className="ticket-cyber scanline-effect" style={{ marginBottom: '45px' }}>
        
        {/* Ticket Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="font-cyber" style={{ fontSize: '11px', color: 'var(--cyber-cyan)', letterSpacing: '2px' }}>
              OFFICIAL BROADCAST TICKET
            </span>
            <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: 'white', fontWeight: 800 }}>
              {show.movie_title}
            </h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: 'var(--cyber-magenta)', fontWeight: 600 }}>
              {show.language} &bull; {show.cinema_name}
            </p>
          </div>
            <div className="font-cyber" style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>BOOKING ID</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
                #SZ-{booking.booking_id ? booking.booking_id.substring(0, 8).toUpperCase() : booking.id}
              </div>
              <button 
                onClick={copyBookingId}
                title="Copy full Booking ID for admin verification"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', color: copied ? '#00ff66' : 'var(--cyber-cyan)',
                  background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.2)',
                  borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
                  marginTop: '4px', transition: 'all 0.2s'
                }}
              >
                <Copy size={10} />
                {copied ? 'Copied!' : 'Copy Full ID'}
              </button>
            </div>
        </div>

        <div className="ticket-divider" />

        {/* Ticket Body: Details and QR Code */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Details Table */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 15px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>DATE</div>
              <strong style={{ color: 'white', fontSize: '14px' }}>
                {new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>SHOWTIME</div>
              <strong style={{ color: 'white', fontSize: '14px' }}>
                {show.start_time ? show.start_time.substring(0, 5) : ''}
              </strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>SCREEN</div>
              <strong style={{ color: 'white', fontSize: '14px' }}>
                {show.screen_name}
              </strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>SEAT MATRIX</div>
              <strong className="font-cyber" style={{ color: 'var(--cyber-cyan)', fontSize: '15px', fontWeight: 'bold' }}>
                {booking.seats.join(', ')}
              </strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>PAYMENT</div>
              <strong style={{ color: 'white' }}>INR {parseFloat(booking.total_amount).toFixed(2)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>STATUS</div>
              <span style={{ color: '#00ff66', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ticket size={12} /> CONFIRMED
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            background: '#06070d',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)'
          }}>
            <img 
              src={qrCodeUrl} 
              alt="Booking QR Code" 
              style={{ width: '130px', height: '130px', borderRadius: '6px' }}
            />
            <span className="font-cyber" style={{ fontSize: '9px', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              SCAN AT SCREEN ENTRIES
            </span>
            <div 
              onClick={copyBookingId}
              title="Click to copy Booking ID"
              style={{
                fontSize: '9px', color: 'var(--cyber-cyan)', fontFamily: 'monospace',
                background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)',
                borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                wordBreak: 'break-all', textAlign: 'center', maxWidth: '140px',
                transition: 'all 0.2s'
              }}
            >
              {booking.booking_id}
            </div>
          </div>

        </div>

        {/* Barcode representation */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
          <div style={{
            height: '35px',
            width: '100%',
            background: 'repeating-linear-gradient(90deg, #fff, #fff 2px, transparent 2px, transparent 8px, #fff 8px, #fff 11px, transparent 11px, transparent 15px)',
            opacity: 0.15
          }} />
          <span className="font-cyber" style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '6px' }}>
            TRANSACTION_VERIFIED_SECURE
          </span>
        </div>

      </div>

      {/* Button Controls */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={handlePrint}
          className="cyber-btn cyber-btn-cyan"
          style={{ padding: '10px 20px', fontSize: '12px' }}
        >
          <Printer size={15} />
          Print Ticket
        </button>
        
        <button 
          onClick={handleDownloadPDF}
          className="cyber-btn cyber-btn-cyan"
          style={{ padding: '10px 20px', fontSize: '12px' }}
        >
          <Download size={15} />
          Download PDF
        </button>

        <button 
          onClick={handleWhatsAppShare}
          className="cyber-btn cyber-btn-magenta"
          style={{ padding: '10px 20px', fontSize: '12px' }}
        >
          <Share2 size={15} />
          Share WhatsApp
        </button>

        <Link 
          to="/"
          className="cyber-btn"
          style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '12px' }}
        >
          <HomeIcon size={15} />
          Home Catalogue
        </Link>
      </div>

    </main>
  );
}
