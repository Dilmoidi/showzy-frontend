import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Award, Ticket, Calendar, Clock, 
  ArrowRight, Lock, Moon, Sparkles, AlertCircle 
} from 'lucide-react';

export default function Profile() {
  const { token, API_BASE } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingTab, setBookingTab] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchProfileDetails = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/profile/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        } else {
          setError('Failed to fetch profile details.');
        }
      } catch (err) {
        setError('Network failure connecting to profile records.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileDetails();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber text-glow-cyan">SYNCHRONIZING OPERATOR PROFILE MATRIX...</span>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--cyber-magenta)' }}>{error || 'Authorize terminal to access profile.'}</h2>
        <Link to="/login" className="cyber-btn cyber-btn-cyan" style={{ marginTop: '20px', textDecoration: 'none' }}>Log In</Link>
      </div>
    );
  }

  const { profile, bookings } = profileData;
  const earnedBadges = profile.badges || [];

  // Group bookings
  const now = new Date();
  const upcomingBookings = [];
  const pastBookings = [];
  const cancelledBookings = [];

  bookings.forEach(b => {
    const showDetails = b.show_details || {};
    const showDate = new Date(showDetails.date);
    const showTimeParts = showDetails.start_time ? showDetails.start_time.split(':') : [0, 0];
    showDate.setHours(parseInt(showTimeParts[0]), parseInt(showTimeParts[1]), 0);
    
    if (b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING') {
      if (showDate >= now) {
        upcomingBookings.push(b);
      } else {
        pastBookings.push(b);
      }
    } else {
      cancelledBookings.push(b);
    }
  });

  // Badges metadata mapping
  const BADGES_METADATA = [
    {
      key: 'CINEMA_PIONEER',
      name: 'Cinema Pioneer',
      description: 'Authorize and secure your first movie broadcast signal.',
      icon: Ticket,
      glowColor: 'var(--cyber-cyan)',
      shadow: '0 0 15px rgba(0, 242, 254, 0.4)'
    },
    {
      key: 'SNACK_COMMANDER',
      name: 'Snack Commander',
      description: 'Pre-order canteen rations during secure checkout.',
      icon: Sparkles,
      glowColor: '#ffea00',
      shadow: '0 0 15px rgba(255, 234, 0, 0.4)'
    },
    {
      key: 'SQUAD_LEADER',
      name: 'Squad Leader',
      description: 'Initiate group split payments with fellow operators.',
      icon: Award,
      glowColor: 'var(--cyber-magenta)',
      shadow: '0 0 15px rgba(255, 0, 127, 0.4)'
    },
    {
      key: 'NIGHT_OWL',
      name: 'Night Owl',
      description: 'Attend broadcast signals starting after 21:00 hours.',
      icon: Moon,
      glowColor: '#9d4edd',
      shadow: '0 0 15px rgba(157, 78, 221, 0.4)'
    }
  ];

  return (
    <main style={{ padding: '20px 20px 60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '30px' }}>
        <h1 className="font-cyber text-glow-cyan" style={{ fontSize: '28px', margin: '0 0 6px 0', letterSpacing: '1px' }}>
          OPERATOR PROFILE
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Manage your secure credentials, earned experience accolades, and reservation logs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Left Side: User Profile Summary & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Operator Details Card */}
          <div className="glass-panel" style={{ padding: '30px', background: 'rgba(13, 15, 30, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--cyber-cyan)'
              }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '18px' }}>{profile.username}</h3>
                <span className="font-cyber" style={{ fontSize: '10px', color: 'var(--cyber-cyan)', letterSpacing: '1px' }}>
                  OPERATOR IDENTIFIED
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <Mail size={16} />
                 <span>{profile.email || 'no-email@showzy.com'}</span>
              </div>
              
              {/* Points Box */}
              <div style={{ 
                marginTop: '10px',
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(123, 44, 191, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)', 
                border: '1px solid var(--border-active)', 
                borderRadius: '12px', 
                textAlign: 'center',
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.1)'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  REWARD EXPERIENCE POINTS
                </span>
                <strong className="font-cyber text-glow-cyan" style={{ fontSize: '28px', fontWeight: 900 }}>
                  {profile.reward_points} PTS
                </strong>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--cyber-cyan)', marginTop: '8px' }}>
                  1 PTS = 1 INR Instant Checkout Discount
                </span>
              </div>
            </div>
          </div>

          {/* Badges Inventory Panel */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '14px', margin: '0 0 20px 0', letterSpacing: '1px' }}>
              EXPERIENCE BADGES
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {BADGES_METADATA.map(badge => {
                const isUnlocked = earnedBadges.includes(badge.key);
                const IconComponent = badge.icon;
                
                return (
                  <div key={badge.key} style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center',
                    opacity: isUnlocked ? 1 : 0.4,
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Badge Icon circle */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: isUnlocked ? 'rgba(6, 7, 13, 0.8)' : 'rgba(255,255,255,0.02)',
                      border: isUnlocked ? `2px solid ${badge.glowColor}` : '1px dashed var(--text-secondary)',
                      color: isUnlocked ? badge.glowColor : 'var(--text-secondary)',
                      boxShadow: isUnlocked ? badge.shadow : 'none',
                      flexShrink: 0
                    }}>
                      {isUnlocked ? <IconComponent size={20} /> : <Lock size={16} />}
                    </div>
                    
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: isUnlocked ? 'white' : 'var(--text-secondary)' }}>
                        {badge.name}
                      </strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {badge.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Booking Logs (receipt cards) */}
        <div className="glass-panel" style={{ padding: '30px', minHeight: '500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '14px', margin: 0, letterSpacing: '1px' }}>
              BROADCAST TRANSACTION LOGS
            </h3>
            
            {/* Booking Tab controls */}
            <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {['upcoming', 'past', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setBookingTab(tab)}
                  className="font-cyber"
                  style={{
                    padding: '6px 12px',
                    fontSize: '9px',
                    background: bookingTab === tab ? 'var(--cyber-cyan)' : 'transparent',
                    color: bookingTab === tab ? '#06070d' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Filter selection list */}
          {(() => {
            const activeBookings = 
              bookingTab === 'upcoming' ? upcomingBookings :
              bookingTab === 'past' ? pastBookings :
              cancelledBookings;

            if (activeBookings.length === 0) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  <AlertCircle size={40} style={{ opacity: 0.15, marginBottom: '15px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>No {bookingTab} transaction logs found.</p>
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeBookings.map(booking => {
                  const showDetails = booking.show_details || {};
                  const isConfirmed = booking.booking_status === 'CONFIRMED';
                  const isPending = booking.booking_status === 'PENDING';
                  
                  // Color mapping for booking status
                  const getStatusColor = () => {
                    if (isConfirmed) return '#00ff66';
                    if (isPending) return 'var(--cyber-cyan)';
                    return 'var(--cyber-magenta)';
                  };

                  return (
                    <div key={booking.id} style={{
                      background: 'rgba(6, 7, 13, 0.4)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      borderLeft: `4px solid ${getStatusColor()}`
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '16px', color: 'white', display: 'block' }}>
                            {showDetails.movie_title}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {showDetails.cinema_name} &bull; {showDetails.screen_name}
                          </span>
                        </div>
                        
                        {/* Status label */}
                        <span className="font-cyber" style={{ 
                          fontSize: '11px', 
                          color: getStatusColor(),
                          fontWeight: 'bold',
                          letterSpacing: '0.5px'
                        }}>
                          {booking.booking_status}
                        </span>
                      </div>

                      {/* Details Table */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px 15px', fontSize: '12px', color: 'var(--text-secondary)', paddingBottom: '15px', borderBottom: '1px dashed var(--border-glass)' }}>
                        <div>
                          <span>BROADCAST TIME</span>
                          <strong style={{ display: 'block', color: 'white', marginTop: '2px' }}>
                            {new Date(showDetails.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {showDetails.start_time.substring(0, 5)}
                          </strong>
                        </div>
                        <div>
                          <span>SEAT MATRIX</span>
                          <strong style={{ display: 'block', color: 'white', marginTop: '2px' }}>
                            {booking.seats ? booking.seats.join(', ') : ''}
                          </strong>
                        </div>
                        <div>
                          <span>CHARGES PAID</span>
                          <strong style={{ display: 'block', color: 'white', marginTop: '2px' }}>
                            INR {parseFloat(booking.total_amount).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span className="font-cyber" style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                          LOGID #SZ-{booking.booking_id ? booking.booking_id.substring(0, 8).toUpperCase() : booking.id}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                          {isConfirmed && (
                            <>
                              <button 
                                onClick={() => setSelectedBooking(booking)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--cyber-cyan)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                View TicketPass
                              </button>
                              
                              <button 
                                onClick={() => window.open(`${API_BASE}/download-ticket/${booking.booking_id || booking.id}/`, '_blank')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer'
                                }}
                              >
                                PDF
                              </button>
                            </>
                          )}

                          {isPending && (
                            <Link 
                              to={`/bookings/${booking.id}/pay`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--cyber-cyan)',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            >
                              Complete Payment <ArrowRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>

      </div>

      {/* digital Pass QR Modal Overlay */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--cyber-cyan)',
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedBooking(null)}
              style={{
                position: 'absolute',
                top: '15px', right: '15px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>

            {/* Ticket Content */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span className="font-cyber" style={{ fontSize: '9px', color: 'var(--cyber-cyan)', letterSpacing: '1px' }}>
                DIGITAL BROADCAST PASS
              </span>
              <h2 style={{ fontSize: '20px', margin: '5px 0', color: 'white', fontWeight: 800 }}>
                {selectedBooking.show_details?.movie_title}
              </h2>
              <p style={{ color: 'var(--cyber-magenta)', fontSize: '12px', margin: 0, fontWeight: 600 }}>
                {selectedBooking.show_details?.cinema_name} &bull; {selectedBooking.show_details?.screen_name}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
              background: 'rgba(0,0,0,0.2)',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid var(--border-glass)',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>SHOW TIME</span>
                <strong style={{ display: 'block', color: 'white', marginTop: '2px' }}>
                  {new Date(selectedBooking.show_details?.date).toLocaleDateString()} at {selectedBooking.show_details?.start_time.substring(0, 5)}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>SEAT MATRIX</span>
                <strong style={{ display: 'block', color: 'var(--cyber-cyan)', marginTop: '2px' }}>
                  {selectedBooking.seats?.join(', ')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>BOOKING ID</span>
                <strong style={{ display: 'block', color: 'white', marginTop: '2px' }}>
                  #SZ-{selectedBooking.booking_id ? selectedBooking.booking_id.substring(0, 8).toUpperCase() : selectedBooking.id}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>PAYMENT STATUS</span>
                <strong style={{ display: 'block', color: '#00ff66', marginTop: '2px' }}>
                  {selectedBooking.booking_status}
                </strong>
              </div>
            </div>

            {/* QR Code */}
            {selectedBooking.booking_status === 'CONFIRMED' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  padding: '10px',
                  background: '#06070d',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}>
                  <img 
                    src={selectedBooking.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=00f2fe&bgcolor=06070d&data=${encodeURIComponent(JSON.stringify({ booking_id: selectedBooking.booking_id, token: selectedBooking.qr_token }))}`}
                    alt="Ticket QR"
                    style={{ width: '130px', height: '130px', display: 'block', borderRadius: '6px' }}
                  />
                </div>
                <span className="font-cyber" style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '1px' }}>
                  SCAN AT CINEMA GATE
                </span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.open(`${API_BASE}/download-ticket/${selectedBooking.booking_id || selectedBooking.id}/`, '_blank')}
                className="cyber-btn cyber-btn-cyan"
                style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '8px' }}
              >
                Download PDF
              </button>
              <button 
                onClick={() => {
                  const text = `Hey! Check out my movie pass for "${selectedBooking.show_details?.movie_title}" at ${selectedBooking.show_details?.cinema_name}.\nSeats: ${selectedBooking.seats?.join(', ')}\nShowtime: ${new Date(selectedBooking.show_details?.date).toLocaleDateString()} at ${selectedBooking.show_details?.start_time.substring(0, 5)}\nBooking ID: #SZ-${selectedBooking.booking_id ? selectedBooking.booking_id.substring(0, 8).toUpperCase() : selectedBooking.id}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="cyber-btn cyber-btn-magenta"
                style={{ padding: '8px 16px', fontSize: '11px', borderRadius: '8px' }}
              >
                WhatsApp Share
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
