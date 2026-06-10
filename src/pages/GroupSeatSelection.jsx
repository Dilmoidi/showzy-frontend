import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Armchair, ShieldCheck, CreditCard, ChevronLeft, Users, Copy, Check } from 'lucide-react';

export default function GroupSeatSelection() {
  const { showId, sessionToken } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, API_BASE } = useAuth();
  
  const [show, setShow] = useState(null);
  const [seatingPlan, setSeatingPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Time remaining (countdown from 5 mins / 300s)
  const [timeLeft, setTimeLeft] = useState(300);

  // Keep a ref to avoid stale state in polling callbacks
  const pollIntervalRef = useRef(null);

  const inviteLink = `${window.location.origin}/shows/${showId}/group/${sessionToken}`;

  const fetchSeats = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Include authorization header if logged in so we get SELECTED_BY_ME vs SELECTED_BY_FRIEND
      const headers = {};
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/shows/group/${sessionToken}/seats/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setShow(data.show);
        setSeatingPlan(data.seating_plan);
      } else {
        setError('Failed to fetch group seating plan');
      }
    } catch (e) {
      setError('Network error syncing seats');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Load
    fetchSeats(true);

    // 2. Set 3-second Polling for Collaborative selections
    pollIntervalRef.current = setInterval(() => {
      fetchSeats(false);
    }, 3000);

    // 3. Set standard 5-minute checkout countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timer);
    };
  }, [sessionToken, API_BASE, token]);

  const handleSeatClick = async (seat) => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const isSelectedByMe = seat.group_lock_status === 'SELECTED_BY_ME';
    const isAvailable = seat.group_lock_status === 'AVAILABLE';

    if (!isAvailable && !isSelectedByMe) return; // Locked by friend or other booking

    try {
      if (isAvailable) {
        // Lock seat on backend
        const response = await fetch(`${API_BASE}/shows/group/${sessionToken}/lock/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ seat_ids: [seat.seat_id] })
        });
        if (response.ok) {
          // Instantly refresh layout
          fetchSeats(false);
        } else {
          const errData = await response.json();
          alert(errData.error || 'Failed to select seat');
        }
      } else {
        // Unlock/Deselect seat on backend
        const response = await fetch(`${API_BASE}/shows/group/${sessionToken}/unlock/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ seat_ids: [seat.seat_id] })
        });
        if (response.ok) {
          fetchSeats(false);
        }
      }
    } catch (e) {
      console.error("Error toggling seat lock", e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract selected seats for the current user
  const getMySelectedSeats = () => {
    const list = [];
    Object.keys(seatingPlan).forEach(row => {
      seatingPlan[row].forEach(seat => {
        if (seat.group_lock_status === 'SELECTED_BY_ME') {
          list.push(seat);
        }
      });
    });
    return list;
  };

  const getSeatPrice = (type) => {
    if (!show) return 0;
    if (type === 'PREMIUM') return parseFloat(show.premium_price);
    if (type === 'RECLINER') return parseFloat(show.recliner_price);
    return parseFloat(show.classic_price);
  };

  const calculateTicketTotal = () => {
    return getMySelectedSeats().reduce((sum, seat) => sum + getSeatPrice(seat.seat_type), 0);
  };

  const handleProceedToPay = async () => {
    const mySeats = getMySelectedSeats();
    if (mySeats.length === 0) return;
    
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/shows/group/${sessionToken}/checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Forward to the snack page, carrying over booking ID
        navigate(`/shows/${showId}/food`, { 
          state: { 
            bookingData: data,
            showData: show, 
            seats: mySeats 
          } 
        });
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to complete group checkout session');
      }
    } catch (e) {
      alert('Network error preparing booking payment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber" style={{ color: 'var(--cyber-cyan)' }}>CONNECTING TO GROUP SESSION...</span>
      </div>
    );
  }

  const mySelectedSeats = getMySelectedSeats();

  const getSeatColor = (seat) => {
    if (seat.group_lock_status === 'SELECTED_BY_ME') return 'var(--cyber-cyan)'; // Gold
    if (seat.group_lock_status === 'SELECTED_BY_FRIEND') return '#FFB300'; // Amber/Orange
    if (seat.group_lock_status === 'LOCKED_BY_OTHER') return '#151515'; // Booked/Dull grey
    
    if (seat.seat_type === 'RECLINER') return 'rgba(212, 175, 55, 0.15)'; 
    if (seat.seat_type === 'PREMIUM') return 'rgba(197, 168, 128, 0.2)'; 
    return 'rgba(37, 36, 34, 0.6)'; 
  };

  const getSeatBorder = (seat) => {
    if (seat.group_lock_status === 'SELECTED_BY_ME') return '2px solid var(--cyber-cyan)';
    if (seat.group_lock_status === 'SELECTED_BY_FRIEND') return '2px dashed #FFB300';
    if (seat.group_lock_status === 'LOCKED_BY_OTHER') return '1px solid rgba(255,255,255,0.03)';
    
    if (seat.seat_type === 'RECLINER') return '2px solid #D4AF37';
    if (seat.seat_type === 'PREMIUM') return '2px solid #C5A880';
    return '2px solid #252422';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <main style={{ padding: '0 20px 40px 20px', display: 'flex', gap: '30px', flexWrap: 'wrap', background: '#0D0D0D' }}>
      
      {/* Left: Seat Map Grid & Invite Link Banner */}
      <div style={{ flex: 1, minWidth: '350px' }}>
        
        {/* Back Link */}
        <button 
          onClick={() => navigate(-1)} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Leave Group
        </button>

        {/* Invite Link Banner */}
        <div style={{ 
          background: '#1A1917', 
          border: '1px solid #C5A880', 
          padding: '16px 20px', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h4 style={{ margin: 0, color: '#F5F5F7', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Users size={16} style={{ color: '#D4AF37' }} /> Share booking link with friends!
            </h4>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '11px' }}>
              Friends can click this link to join your session, pick their own seats, and pay individually.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#C5A880', background: '#0D0D0D', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              {inviteLink.length > 40 ? `${inviteLink.substring(0, 38)}...` : inviteLink}
            </span>
            <button 
              onClick={copyToClipboard}
              style={{
                background: '#D4AF37',
                border: 'none',
                color: '#0D0D0D',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Theatre Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px 0', color: '#F5F5F7' }}>{show.movie_title} (Group Session)</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            {show.cinema_name} &bull; {show.screen_name} &bull; {new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, {show.start_time ? show.start_time.substring(0, 5) : ''}
          </p>
        </div>

        {/* Curved screen projection banner */}
        <div className="movie-screen-container">
          <div className="movie-screen" style={{ background: 'linear-gradient(to bottom, #D4AF37 0%, rgba(212, 175, 55, 0.1) 80%, transparent 100%)', boxShadow: '0 0 25px rgba(212, 175, 55, 0.8)' }} />
          <div className="screen-text" style={{ color: '#C5A880' }}>All Eyes This Way</div>
        </div>

        {/* Seating Grid Map */}
        <div style={{
          overflowX: 'auto',
          padding: '24px',
          background: '#1A1917',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          {Object.keys(seatingPlan).sort().map(rowName => (
            <div key={rowName} style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              
              <span className="font-cyber" style={{ width: '24px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                {rowName}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {seatingPlan[rowName].map((seat, index) => {
                  const isAvailable = seat.group_lock_status === 'AVAILABLE' || seat.group_lock_status === 'SELECTED_BY_ME';
                  const addGap = index === 2 || index === 7;
                  
                  return (
                    <React.Fragment key={seat.seat_id}>
                      <button
                        onClick={() => handleSeatClick(seat)}
                        disabled={!isAvailable}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: getSeatColor(seat),
                          border: getSeatBorder(seat),
                          color: !isAvailable && seat.group_lock_status === 'LOCKED_BY_OTHER' ? 'transparent' : '#F5F5F7',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: seat.group_lock_status === 'SELECTED_BY_ME' ? '0 0 12px var(--cyber-cyan)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        title={
                          seat.group_lock_status === 'SELECTED_BY_FRIEND' 
                            ? `Selected by Friend (${seat.locked_by_username})` 
                            : `Seat ${rowName}${seat.number} (${seat.seat_type})`
                        }
                      >
                        {seat.number}
                      </button>
                      {addGap && <div style={{ width: '16px' }} />}
                    </React.Fragment>
                  );
                })}
              </div>

              <span className="font-cyber" style={{ width: '24px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                {rowName}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '25px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: 'rgba(37, 36, 34, 0.6)', border: '2px solid #252422', borderRadius: '4px' }} />
            <span>Classic</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: 'rgba(197, 168, 128, 0.2)', border: '2px solid #C5A880', borderRadius: '4px' }} />
            <span>Premium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: 'rgba(212, 175, 55, 0.15)', border: '2px solid #D4AF37', borderRadius: '4px' }} />
            <span>Recliner</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: 'var(--cyber-cyan)', border: '2px solid var(--cyber-cyan)', borderRadius: '4px' }} />
            <span>Your Selection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: '#FFB300', border: '2px dashed #FFB300', borderRadius: '4px' }} />
            <span>Friend's Selection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '15px', height: '15px', background: '#151515', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }} />
            <span>Reserved/Booked</span>
          </div>
        </div>
      </div>

      {/* Right: Pricing & Seating Summary Panel */}
      <div className="glass-panel" style={{
        flex: '0 0 360px',
        padding: '24px',
        background: '#1A1917',
        border: '1px solid #C5A880',
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'flex-start',
        borderRadius: '16px'
      }}>
        
        {/* Countdown Header */}
        <div style={{ 
          background: 'rgba(212, 175, 55, 0.1)', 
          border: '1px solid #D4AF37',
          color: '#D4AF37',
          padding: '8px 15px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span>SESSION TIMER:</span>
          <strong>{formatTime(timeLeft)}</strong>
        </div>

        <h3 style={{ fontSize: '15px', margin: '0 0 15px 0', color: '#D4AF37', fontWeight: 'bold' }}>YOUR TICKET SUMMARY</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '15px', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', marginBottom: '15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Classic Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show?.classic_price}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Premium Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show?.premium_price}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Recliner Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show?.recliner_price}</strong>
          </div>
        </div>

        {mySelectedSeats.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', marginBottom: '6px' }}>MY SELECTED SEATS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {mySelectedSeats.map(seat => (
                  <span 
                    key={seat.seat_id} 
                    style={{ 
                      padding: '4px 10px', 
                      background: 'rgba(212, 175, 55, 0.1)', 
                      border: '1px solid #D4AF37', 
                      color: '#D4AF37',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {seat.row}{seat.number}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '15px', display: 'flex', justify: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', color: '#F5F5F7', fontWeight: 'bold' }}>My Ticket Price:</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#D4AF37' }}>
                INR {calculateTicketTotal().toFixed(2)}
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 0, 127, 0.08)', border: '1px solid var(--cyber-magenta)', color: 'var(--cyber-magenta)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <button 
              onClick={handleProceedToPay} 
              disabled={bookingLoading}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '12px',
                background: '#D4AF37',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 10px rgba(212, 175, 55, 0.2)'
              }}
            >
              <CreditCard size={16} />
              {bookingLoading ? 'HOLDING SEATS...' : 'PROCEED TO SNACKS'}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={12} style={{ color: '#D4AF37' }} />
              <span>Only your selected seats will be checked out.</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Armchair size={36} style={{ opacity: 0.2, marginBottom: '10px' }} />
            <p style={{ fontSize: '13px', margin: 0 }}>Select available seats in the theatre grid. Friends will see your selections live!</p>
          </div>
        )}
      </div>

    </main>
  );
}
