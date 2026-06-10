import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronLeft, Plus, Minus, UtensilsCrossed, Clock, ShoppingBag } from 'lucide-react';

export default function SelectFood() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, API_BASE } = useAuth();

  const routeState = location.state || {};
  const [show, setShow] = useState(routeState.showData || null);
  const [selectedSeats, setSelectedSeats] = useState(routeState.seats || []);

  const [foodItemsList, setFoodItemsList] = useState([]);
  const [foodQuantities, setFoodQuantities] = useState({}); // { [itemId]: qty }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);

  // Time remaining (countdown from 5 mins / 300s)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    // If no seats selected, send back
    if (selectedSeats.length === 0) {
      navigate(`/shows/${showId}/seats`);
      return;
    }

    // Set countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Your seat lock has expired. Please select seats again.");
          navigate(`/shows/${showId}/seats`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const fetchShowAndFood = async () => {
      setLoading(true);
      try {
        // Fetch show if not in state
        if (!show) {
          const showRes = await fetch(`${API_BASE}/shows/${showId}/seats/`);
          if (showRes.ok) {
            const showData = await showRes.json();
            setShow(showData.show);
          }
        }

        // Fetch food menu
        const res = await fetch(`${API_BASE}/food/`);
        if (res.ok) {
          const data = await res.json();
          setFoodItemsList(data);
          const q = {};
          data.forEach(item => { q[item.id] = 0; });
          setFoodQuantities(q);
        } else {
          setError('Failed to load canteen snacks');
        }
      } catch (err) {
        setError('Network error loading page elements');
      } finally {
        setLoading(false);
      }
    };

    fetchShowAndFood();
    return () => clearInterval(timer);
  }, [showId, API_BASE, navigate]);

  const handleFoodQtyChange = (itemId, change) => {
    setFoodQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  // Pricing calculations
  const getSeatPrice = (type) => {
    if (!show) return 0;
    if (type === 'PREMIUM') return parseFloat(show.premium_price);
    if (type === 'RECLINER') return parseFloat(show.recliner_price);
    return parseFloat(show.classic_price);
  };

  const calculateTicketTotal = () => {
    return selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat.seat_type), 0);
  };

  // Simulate Net Ticket Price (82% of ticket cost) and GST (18%)
  const ticketNetPrice = calculateTicketTotal() / 1.18;
  const ticketGST = calculateTicketTotal() - ticketNetPrice;

  const calculateFoodTotal = () => {
    return foodItemsList.reduce((sum, item) => {
      const qty = foodQuantities[item.id] || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const calculateTaxesAndFees = () => {
    // 30 INR flat internet handling charge + 18% GST on handling charge (5.4 INR)
    return selectedSeats.length * 34.22;
  };

  const calculateGrandTotal = () => {
    return calculateTicketTotal() + calculateFoodTotal() + calculateTaxesAndFees();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs} Mins Remaining`;
  };

  const getFoodCategory = (foodName) => {
    const nameLower = foodName.toLowerCase();
    if (nameLower.includes('popcorn')) return 'POPCORN';
    if (nameLower.includes('combo')) return 'COMBOS';
    if (nameLower.includes('pepsi') || nameLower.includes('water') || nameLower.includes('drink') || nameLower.includes('beverage') || nameLower.includes('soda') || nameLower.includes('juice')) return 'BEVERAGES';
    return 'SNACKS';
  };

  // Filters logic
  const filteredFood = foodItemsList.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Veg/Non-veg detection based on names/descriptions
    const nameLower = food.name.toLowerCase();
    const isVeg = !nameLower.includes('chicken') && !nameLower.includes('fish') && !nameLower.includes('egg');
    
    const matchesVeg = !vegOnly || isVeg;
    const matchesNonVeg = !nonVegOnly || !isVeg;

    const matchesCategory = activeCategory === 'ALL' || getFoodCategory(food.name) === activeCategory;

    return matchesSearch && matchesVeg && matchesNonVeg && matchesCategory;
  });

  const getAddedSnacks = () => {
    return foodItemsList.filter(item => foodQuantities[item.id] > 0);
  };

  const handleContinue = async () => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const foodItemsPayload = Object.keys(foodQuantities)
      .map(id => ({ id: parseInt(id), quantity: foodQuantities[id] }))
      .filter(item => item.quantity > 0);
    
    if (routeState.bookingData) {
      try {
        const response = await fetch(`${API_BASE}/bookings/${routeState.bookingData.booking_id}/add-food/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ food_items: foodItemsPayload })
        });
        
        if (response.ok) {
          const resData = await response.json();
          navigate(`/bookings/${routeState.bookingData.booking_id}/pay`, { 
            state: { 
              bookingData: {
                ...routeState.bookingData,
                booking_foods: foodItemsPayload.map(f => {
                  const matched = foodItemsList.find(x => x.id === f.id);
                  return {
                    id: f.id,
                    food_item: f.id,
                    name: matched ? matched.name : 'Canteen Snack',
                    price: matched ? matched.price : 0,
                    quantity: f.quantity
                  };
                }),
                total_amount: resData.total_amount
              },
              showData: show,
              seats: selectedSeats
            } 
          });
        } else {
          alert("Failed to save food items to booking.");
        }
      } catch (err) {
        alert("Network error updating booking snacks.");
      }
    } else {
      // Proceed to final payment summary passing selected food quantities
      navigate(`/bookings/checkout/pay`, { 
        state: { 
          showData: show, 
          seats: selectedSeats, 
          foodQuantities: foodQuantities 
        } 
      });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber" style={{ color: '#D4AF37' }}>INITIALIZING CANTEEN DATABASE...</span>
      </div>
    );
  }

  const addedSnacksList = getAddedSnacks();
  const totalSnackItemsCount = addedSnacksList.reduce((sum, item) => sum + foodQuantities[item.id], 0);

  return (
    <main style={{ padding: '20px 0 40px 0', display: 'flex', gap: '30px', flexWrap: 'wrap', background: '#0D0D0D' }}>
      
      {/* Left Column: Order Snacks Selection Layout */}
      <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation / Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{
              background: '#1A1917',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F5F5F7',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0, color: '#F5F5F7', fontWeight: 'bold' }}>Order Snacks</h1>
            <p style={{ margin: 0, color: '#C5A880', fontSize: '13px' }}>{show?.cinema_name}</p>
          </div>
        </div>

        {/* Bank Promotions horizontal slider */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          overflowX: 'auto', 
          paddingBottom: '15px', 
          marginBottom: '20px',
          scrollbarWidth: 'none'
        }}>
          {[
            { title: "BOBCARD Up To 10% Off* On F&B", desc: "Use code BOBFB10 on select cards", code: "BOBFB10" },
            { title: "IDBI Bank - 25% Off On Transactions", desc: "Valid on all movie + snack bookings", code: "IDBI25" },
            { title: "Kotak PVR INOX Card - 20% Off F&B", desc: "Instant discount for cardholders", code: "KOTAK20" }
          ].map((promo, idx) => (
            <div key={idx} style={{ 
              flex: '0 0 280px', 
              background: '#1A1917', 
              border: '1.5px solid rgba(212, 175, 55, 0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '20px' }}>🏷️</span>
              <div>
                <strong style={{ fontSize: '13px', color: '#F5F5F7', display: 'block' }}>{promo.title}</strong>
                <span style={{ fontSize: '11px', color: '#C5A880', display: 'block', marginTop: '2px' }}>{promo.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter categories & Toggle options */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          {/* Veg/Non-veg Switches */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#F5F5F7' }}>
              <span style={{ width: '12px', height: '12px', border: '1px solid #00aa00', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                <span style={{ width: '6px', height: '6px', background: '#00aa00', borderRadius: '50%' }} />
              </span>
              <span>Veg</span>
              <input 
                type="checkbox" 
                checked={vegOnly} 
                onChange={(e) => { setVegOnly(e.target.checked); if (e.target.checked) setNonVegOnly(false); }}
                style={{ accentColor: '#D4AF37' }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#F5F5F7' }}>
              <span style={{ width: '12px', height: '12px', border: '1px solid #cc0000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                <span style={{ width: '6px', height: '6px', background: '#cc0000', borderRadius: '50%' }} />
              </span>
              <span>Non-veg</span>
              <input 
                type="checkbox" 
                checked={nonVegOnly} 
                onChange={(e) => { setNonVegOnly(e.target.checked); if (e.target.checked) setVegOnly(false); }}
                style={{ accentColor: '#D4AF37' }}
              />
            </label>
          </div>

          {/* Categories pill list */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['ALL', 'POPCORN', 'COMBOS', 'BEVERAGES', 'SNACKS'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? '#D4AF37' : '#1A1917',
                  color: activeCategory === cat ? '#0D0D0D' : '#C5A880',
                  border: activeCategory === cat ? 'none' : '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '30px',
                  padding: '6px 16px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'ALL' ? 'ALL ITEMS' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C5A880' }} />
          <input 
            type="text" 
            placeholder="Search popcorn, beverages, or combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 42px',
              background: '#1A1917',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              borderRadius: '8px',
              color: '#F5F5F7',
              outline: 'none',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Food list container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '8px' }}>
          {filteredFood.length > 0 ? (
            filteredFood.map(food => {
              const qty = foodQuantities[food.id] || 0;
              const isVeg = !food.name.toLowerCase().includes('chicken') && !food.name.toLowerCase().includes('fish');
              
              return (
                <div key={food.id} style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  alignItems: 'center', 
                  background: '#1A1917',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                  borderRadius: '12px',
                  padding: '15px'
                }}>
                  {food.image_url ? (
                    <img 
                      src={food.image_url} 
                      alt={food.name} 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(212, 175, 55, 0.15)' }} 
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                      <UtensilsCrossed size={28} style={{ color: 'rgba(212, 175, 55, 0.3)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Veg indicator dot */}
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      border: `1.5px solid ${isVeg ? '#00aa00' : '#cc0000'}`, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '1px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ width: '5px', height: '5px', background: isVeg ? '#00aa00' : '#cc0000', borderRadius: '50%' }} />
                    </span>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#F5F5F7' }}>{food.name}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.description}</span>
                    <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>INR {parseInt(food.price)}</span>
                  </div>
                  
                  {/* Add / Counter Button */}
                  <div>
                    {qty === 0 ? (
                      <button 
                        onClick={() => handleFoodQtyChange(food.id, 1)}
                        style={{
                          background: '#1A1917',
                          border: '1.5px solid #D4AF37',
                          color: '#D4AF37',
                          padding: '6px 20px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(212, 175, 55, 0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#D4AF37'; e.currentTarget.style.color = '#0D0D0D'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1917'; e.currentTarget.style.color = '#D4AF37'; }}
                      >
                        Add
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0D0D0D', border: '1px solid #C5A880', borderRadius: '6px', padding: '4px 8px' }}>
                        <button 
                          onClick={() => handleFoodQtyChange(food.id, -1)}
                          style={{ background: 'transparent', border: 'none', color: '#C5A880', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#F5F5F7', minWidth: '16px', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button 
                          onClick={() => handleFoodQtyChange(food.id, 1)}
                          style={{ background: 'transparent', border: 'none', color: '#C5A880', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No canteen items matched your filters.
            </div>
          )}
        </div>

        {/* Bottom Total Checkout Bar */}
        <div style={{ 
          marginTop: '25px', 
          background: '#1A1917', 
          border: '1.5px solid #C5A880',
          borderRadius: '12px', 
          padding: '15px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Added Snacks</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '14px' }}>🛒 {totalSnackItemsCount} items</span>
              <span style={{ color: '#F5F5F7', fontSize: '16px', fontWeight: '900' }}>INR {calculateFoodTotal().toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handleContinue}
            style={{
              background: '#D4AF37',
              color: '#0D0D0D',
              border: 'none',
              padding: '12px 35px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)'
            }}
          >
            Continue <ShoppingBag size={15} />
          </button>
        </div>

      </div>

      {/* Right Column: Checkout Summary and Live calculations */}
      <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Sticky Timer Header */}
        <div style={{ 
          background: '#D4AF37', 
          color: '#0D0D0D', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          fontWeight: '900', 
          fontFamily: 'var(--font-cyber)', 
          textAlign: 'center',
          fontSize: '14px',
          boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Clock size={16} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Live Bill Break-down panel */}
        <div className="glass-panel" style={{ padding: '25px', background: '#1A1917', border: '1px solid #C5A880' }}>
          <h3 style={{ fontSize: '15px', color: '#D4AF37', fontWeight: 'bold', margin: '0 0 15px 0', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '8px' }}>
            Booking Summary
          </h3>

          {/* Movie poster and title details */}
          {show && (
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              {show.movie_poster && (
                <img 
                  src={show.movie_poster} 
                  alt={show.movie_title} 
                  style={{ width: '65px', height: '90px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.05)' }} 
                />
              )}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#F5F5F7', lineHeight: '1.3' }}>
                  {show.movie_title.toUpperCase()} ({show.language ? show.language.toUpperCase() : ''})
                </strong>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  UA 13+ &bull; {show.genre || 'Action'}
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#C5A880', marginTop: '2px' }}>
                  {show.cinema_name}
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, {show.start_time ? show.start_time.substring(0, 5) : ''}
                </span>
              </div>
            </div>
          )}

          {/* Seat details */}
          <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.08)', paddingTop: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', display: 'block', letterSpacing: '0.5px' }}>SEAT INFO</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#F5F5F7', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {selectedSeats[0]?.seat_type || 'CLASSIC'}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {selectedSeats.map(seat => (
                  <span key={seat.seat_id} style={{ padding: '2px 8px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid #D4AF37', borderRadius: '4px', fontSize: '11px', color: '#D4AF37', fontWeight: 'bold' }}>
                    {seat.row}{seat.number}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ticket subtotal itemized */}
          <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.08)', paddingTop: '15px', paddingBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>TICKETS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Net Price ({selectedSeats.length} x Ticket(s))</span>
                <span style={{ color: '#F5F5F7' }}>INR {ticketNetPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (18%)</span>
                <span style={{ color: '#F5F5F7' }}>INR {ticketGST.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#F5F5F7', marginTop: '2px' }}>
                <span>Total Ticket Price</span>
                <span>INR {calculateTicketTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Snacks itemized summary */}
          <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.08)', paddingTop: '15px', paddingBottom: '15px' }}>
            <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>SNACKS</span>
            {addedSnacksList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {addedSnacksList.map(item => (
                  <div key={item.id} style={{ display: 'flex', justify: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <span>{item.name} <strong style={{ color: '#D4AF37' }}>x{foodQuantities[item.id]}</strong></span>
                    <strong style={{ color: '#F5F5F7' }}>INR {(item.price * foodQuantities[item.id]).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <span>🍿 No snacks added</span>
              </div>
            )}
          </div>

          {/* Final payment breakdown */}
          <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '15px' }}>
            <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>PAYMENT DETAILS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sub Total</span>
                <span style={{ color: '#F5F5F7' }}>INR {(calculateTicketTotal() + calculateFoodTotal()).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Taxes & Fees</span>
                <span style={{ color: '#F5F5F7' }}>INR {calculateTaxesAndFees().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px dashed rgba(212, 175, 55, 0.15)', paddingTop: '10px', marginTop: '4px' }}>
                <strong style={{ color: '#F5F5F7', fontSize: '13.5px' }}>Grand Total</strong>
                <strong style={{ color: '#D4AF37', fontSize: '17px', fontWeight: '900' }}>
                  INR {calculateGrandTotal().toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}
