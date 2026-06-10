import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Armchair, ShieldCheck, CreditCard, ChevronLeft, Plus, Minus, UtensilsCrossed, X, ShoppingBag, Users } from 'lucide-react';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, API_BASE } = useAuth();
  
  const [show, setShow] = useState(null);
  const [seatingPlan, setSeatingPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of seat objects { id, row, number, seat_type }
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Food and Beverage states
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [foodQuantities, setFoodQuantities] = useState({}); // { [itemId]: qty }
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/shows/${showId}/seats/`);
        if (response.ok) {
          const data = await response.json();
          setShow(data.show);
          setSeatingPlan(data.seating_plan);
        } else {
          setError('Failed to fetch seating plan');
        }
      } catch (e) {
        setError('Network error loading seats');
      } finally {
        setLoading(false);
      }
    };

    const fetchFood = async () => {
      try {
        const res = await fetch(`${API_BASE}/food/`);
        if (res.ok) {
          const data = await res.json();
          setFoodItemsList(data);
          const q = {};
          data.forEach(item => { q[item.id] = 0; });
          setFoodQuantities(q);
        }
      } catch (err) {
        console.error("Failed to load food menu", err);
      }
    };

    fetchSeats();
    fetchFood();
  }, [showId, API_BASE]);

  const handleSeatClick = (seat) => {
    if (seat.status !== 'AVAILABLE') return; 

    const isAlreadySelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));
    } else {
      if (selectedSeats.length >= 10) {
        alert("Maximum of 10 seats can be reserved at a time.");
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getSeatPrice = (type) => {
    if (!show) return 0;
    if (type === 'PREMIUM') return parseFloat(show.premium_price);
    if (type === 'RECLINER') return parseFloat(show.recliner_price);
    return parseFloat(show.classic_price);
  };

  const calculateTicketTotal = () => {
    return selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat.seat_type), 0);
  };

  const calculateFoodTotal = () => {
    return foodItemsList.reduce((sum, item) => {
      const qty = foodQuantities[item.id] || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateTicketTotal() + calculateFoodTotal();
  };

  const handleFoodQtyChange = (itemId, change) => {
    setFoodQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const getSelectedFoodItemsSummary = () => {
    return foodItemsList.filter(item => foodQuantities[item.id] > 0);
  };

  const handleProceedToPay = () => {
    if (selectedSeats.length === 0) return;
    
    navigate(`/shows/${showId}/food`, { 
      state: { 
        showData: show, 
        seats: selectedSeats 
      } 
    });
  };

  const handleStartGroupBooking = async () => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    setBookingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/shows/${showId}/group/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/shows/${showId}/group/${data.session_token}`);
      } else {
        alert("Failed to initialize group booking session.");
      }
    } catch (e) {
      alert("Network error starting group booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber" style={{ color: 'var(--cyber-cyan)' }}>SYNCHRONIZING SEATING INTERFACE...</span>
      </div>
    );
  }

  if (error && !show) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--cyber-magenta)' }}>{error}</h2>
        <button onClick={() => navigate(-1)} className="cyber-btn cyber-btn-cyan" style={{ marginTop: '20px' }}>Go Back</button>
      </div>
    );
  }

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    if (isSelected) return 'var(--cyber-cyan)';
    if (seat.status === 'LOCKED') return 'var(--cyber-magenta)';
    if (seat.status === 'BOOKED') return '#151515';
    
    if (seat.seat_type === 'RECLINER') return 'rgba(212, 175, 55, 0.15)'; 
    if (seat.seat_type === 'PREMIUM') return 'rgba(197, 168, 128, 0.2)'; 
    return 'rgba(37, 36, 34, 0.6)'; 
  };

  const getSeatBorder = (seat) => {
    const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    if (isSelected) return '2px solid var(--cyber-cyan)';
    if (seat.status === 'LOCKED') return '2px solid var(--cyber-magenta)';
    if (seat.status === 'BOOKED') return '1px solid rgba(255,255,255,0.03)';
    
    if (seat.seat_type === 'RECLINER') return '2px solid #D4AF37';
    if (seat.seat_type === 'PREMIUM') return '2px solid #C5A880';
    return '2px solid #252422';
  };

  const getSeatShadow = (seat) => {
    const isSelected = selectedSeats.some(s => s.seat_id === seat.seat_id);
    if (isSelected) return '0 0 12px var(--cyber-cyan)';
    if (seat.status === 'LOCKED') return '0 0 12px var(--cyber-magenta)';
    if (seat.status === 'BOOKED') return 'none';
    
    if (seat.seat_type === 'RECLINER') return '0 0 8px rgba(212, 175, 55, 0.2)';
    if (seat.seat_type === 'PREMIUM') return '0 0 8px rgba(197, 168, 128, 0.2)';
    return 'none';
  };

  return (
    <main style={{ padding: '0 20px 40px 20px', display: 'flex', gap: '30px', flexWrap: 'wrap', background: '#0D0D0D' }}>
      
      {/* Left: Seat Map Grid */}
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
          <ChevronLeft size={16} /> Back to Showtimes
        </button>

        {/* Theatre Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px 0', color: '#F5F5F7' }}>{show.movie_title}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            {show.cinema_name} &bull; {show.screen_name} &bull; {new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, {show.start_time ? show.start_time.substring(0, 5) : ''}
          </p>
        </div>

        {/* Curved screen projection banner */}
        <div className="movie-screen-container">
          <div className="movie-screen" style={{ background: 'linear-gradient(to bottom, #D4AF37 0%, rgba(212, 175, 55, 0.1) 80%, transparent 100%)', boxShadow: '0 0 25px rgba(212, 175, 55, 0.8)' }} />
          <div className="screen-text" style={{ color: '#C5A880' }}>All Eyes This Way</div>
        </div>

        {/* Grid Map */}
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
                  const isAvailable = seat.status === 'AVAILABLE';
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
                          color: seat.status === 'BOOKED' ? 'transparent' : '#F5F5F7',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: getSeatShadow(seat),
                          transition: 'all 0.2s ease'
                        }}
                        title={`Seat ${rowName}${seat.number} (${seat.seat_type})`}
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
          gap: '25px',
          marginTop: '25px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: 'rgba(37, 36, 34, 0.6)', border: '2px solid #252422', borderRadius: '4px' }} />
            <span>Classic</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: 'rgba(197, 168, 128, 0.2)', border: '2px solid #C5A880', borderRadius: '4px' }} />
            <span>Premium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: 'rgba(212, 175, 55, 0.15)', border: '2px solid #D4AF37', borderRadius: '4px' }} />
            <span>Recliner</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: 'var(--cyber-cyan)', border: '2px solid var(--cyber-cyan)', borderRadius: '4px' }} />
            <span>Selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', background: '#151515', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }} />
            <span>Reserved</span>
          </div>
        </div>
      </div>

      {/* Right: Pricing & Seating Summary panel */}
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
        <h3 style={{ fontSize: '16px', margin: '0 0 15px 0', color: '#D4AF37', fontWeight: 'bold' }}>TICKET SUMMARY</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '15px', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', marginBottom: '15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Classic Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show.classic_price}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Premium Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show.premium_price}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Recliner Seats:</span>
            <strong style={{ color: '#F5F5F7' }}>INR {show.recliner_price}</strong>
          </div>
        </div>

        {selectedSeats.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', marginBottom: '6px' }}>SEATS SELECTED</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedSeats.map(seat => (
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

            {/* Price Calculations */}
            <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justify: 'space-between', color: '#C5A880' }}>
                <span>Ticket Subtotal:</span>
                <span>INR {calculateTicketTotal().toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'baseline', marginTop: '5px', marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', color: '#F5F5F7', fontWeight: 'bold' }}>Total Ticket Price:</span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#D4AF37' }}>
                INR {calculateTicketTotal().toFixed(2)}
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 0, 127, 0.08)', border: '1px solid var(--cyber-magenta)', color: 'var(--cyber-magenta)', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '15px' }}>
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '12px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={12} style={{ color: '#D4AF37' }} />
              <span>Seats locked for 5 minutes once booked.</span>
            </div>

            <button 
              type="button"
              onClick={handleStartGroupBooking}
              disabled={bookingLoading}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '12.5px',
                background: 'transparent',
                color: '#D4AF37',
                border: '1.5px solid #D4AF37',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                marginTop: '15px',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.05)'
              }}
            >
              <Users size={16} />
              START GROUP BOOKING
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', gap: '15px' }}>
            <Armchair size={36} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '13px', margin: 0 }}>Select available seats in the theatre grid to start pre-ordering snacks & booking.</p>
            <div style={{ width: '100%', borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '15px' }}>
              <button 
                type="button"
                onClick={handleStartGroupBooking}
                disabled={bookingLoading}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '12px',
                  background: 'transparent',
                  color: '#D4AF37',
                  border: '1.5px solid #D4AF37',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <Users size={16} />
                START GROUP BOOKING
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP F&B MODAL OVERLAY */}
      {isFoodModalOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10000 
        }}>
          <div style={{ 
            background: '#1A1917', 
            border: '1px solid #C5A880', 
            padding: '28px', 
            borderRadius: '16px', 
            width: '90%', 
            maxWidth: '520px', 
            boxShadow: '0 20px 35px rgba(0,0,0,0.8)',
            position: 'relative'
          }}>
            {/* Close Cross */}
            <button 
              onClick={() => setIsFoodModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#C5A880',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#F5F5F7', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <UtensilsCrossed size={18} style={{ color: '#D4AF37' }} /> Canteen Food Menu
            </h3>
            <p style={{ color: '#C5A880', fontSize: '12px', margin: '0 0 20px 0' }}>
              Add popcorn, drinks, and snacks to your cinema experience.
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px', 
              maxHeight: '320px', 
              overflowY: 'auto', 
              marginBottom: '20px',
              paddingRight: '6px'
            }}>
              {foodItemsList.map(food => (
                <div key={food.id} style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  alignItems: 'center', 
                  borderBottom: '1px solid rgba(212, 175, 55, 0.1)', 
                  paddingBottom: '12px' 
                }}>
                  {food.image_url && (
                    <img 
                      src={food.image_url} 
                      alt={food.name} 
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(212, 175, 55, 0.1)' }} 
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#F5F5F7' }}>{food.name}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#C5A880', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.description}</span>
                    <span style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>INR {parseInt(food.price)}</span>
                  </div>
                  
                  {/* Plus Minus Controller */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      type="button"
                      onClick={() => handleFoodQtyChange(food.id, -1)}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        background: '#0D0D0D', 
                        border: '1px solid #C5A880', 
                        color: '#F5F5F7', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#F5F5F7', width: '15px', textAlign: 'center' }}>
                      {foodQuantities[food.id] || 0}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handleFoodQtyChange(food.id, 1)}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        background: '#0D0D0D', 
                        border: '1px solid #C5A880', 
                        color: '#F5F5F7', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsFoodModalOpen(false)} 
                style={{ 
                  background: 'transparent', 
                  border: '1.5px solid rgba(255, 255, 255, 0.15)', 
                  padding: '10px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  fontWeight: 'bold'
                }}
              >
                Go Back
              </button>
              <button 
                onClick={() => completeProceedToPay(true)} 
                style={{ 
                  background: 'transparent', 
                  border: '1.5px solid #C5A880', 
                  padding: '10px 16px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  color: '#C5A880',
                  fontWeight: 'bold'
                }}
              >
                Skip & Proceed
              </button>
              <button 
                onClick={() => completeProceedToPay(false)} 
                style={{ 
                  background: '#D4AF37', 
                  border: 'none', 
                  color: '#0D0D0D', 
                  padding: '10px 20px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                }}
              >
                <ShoppingBag size={14} /> Confirm & Proceed (INR {calculateFoodTotal()})
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
