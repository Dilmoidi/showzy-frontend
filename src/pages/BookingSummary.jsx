import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Timer, AlertTriangle, CheckCircle, CreditCard, XCircle, 
  Plus, Minus, Users, Percent, Award, ShieldCheck, Trash2 
} from 'lucide-react';

export default function BookingSummary() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, API_BASE } = useAuth();
  
  const routeState = location.state || {};
  const isCheckoutMode = bookingId === 'checkout' || location.pathname.includes('/checkout/');

  // State variables for checkout configuration (Phase 1)
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [quantities, setQuantities] = useState({}); // { [itemId]: qty }
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [splitEmails, setSplitEmails] = useState(['']); // array of friend emails
  
  // Base details (Phase 1 & 2)
  const [show, setShow] = useState(routeState.showData || null);
  const [selectedSeats, setSelectedSeats] = useState(routeState.seats || []);
  
  // State variables for locked booking (Phase 2)
  const [booking, setBooking] = useState(routeState.bookingData || null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [loading, setLoading] = useState(!isCheckoutMode && !booking);
  const [paymentRunning, setPaymentRunning] = useState(false);
  const [error, setError] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const timerRef = useRef(null);

  // PVR Payment Page custom state variables
  const [activePaymentMethod, setActivePaymentMethod] = useState('Credit Card');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Initialize Stripe when booking data arrives with a real public key
  useEffect(() => {
    if (booking && booking.stripe_public_key && !stripePromise) {
      setStripePromise(loadStripe(booking.stripe_public_key));
    }
  }, [booking]);

  // 1. Fetch Food menu & Profile Points on Configuration Load
  useEffect(() => {
    if (!token) return;

    if (isCheckoutMode) {
      // Fetch food items
      const fetchFood = async () => {
        try {
          const res = await fetch(`${API_BASE}/food/`);
          if (res.ok) {
            const data = await res.ok ? await res.json() : [];
            setFoodItemsList(data);
            // Initialize quantities from state if passed
            const q = {};
            data.forEach(item => { 
              q[item.id] = routeState.foodQuantities?.[item.id] || 0; 
            });
            setQuantities(q);
          }
        } catch (err) {
          console.error("Error fetching food items", err);
        }
      };

      // Fetch profile details for points balance
      const fetchProfile = async () => {
        try {
          const res = await fetch(`${API_BASE}/profile/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPoints(data.profile?.reward_points || 0);
          }
        } catch (err) {
          console.error("Error fetching profile points", err);
        }
      };

      fetchFood();
      fetchProfile();
    }
  }, [isCheckoutMode, token]);

  // 2. Fetch booking details for Payment Mode if not passed in state
  const fetchBookingDetails = async () => {
    if (isCheckoutMode || booking) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/bookings/user/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const bookings = await response.json();
        const target = bookings.find(b => b.id == bookingId);
        if (target) {
          setBooking({
            booking_id: target.id,
            razorpay_order_id: target.razorpay_order_id,
            total_amount: parseFloat(target.total_amount),
            is_demo: target.razorpay_order_id ? target.razorpay_order_id.startsWith('order_demo_') : true,
            razorpay_key_id: target.razorpay_key_id || 'DEMO',
            expires_at: new Date(new Date(target.created_at).getTime() + 5 * 60 * 1000).toISOString(),
            booking_foods: target.booking_foods || [],
            group_booking: target.group_booking || null,
            seats: target.seats || []
          });
          setShow(target.show_details);
          setSelectedSeats(target.seats.map((seatStr, i) => {
            const match = seatStr.match(/([A-Z]+)(\d+)/);
            const row = match ? match[1] : 'A';
            const number = match ? parseInt(match[2]) : i + 1;
            return { seat_id: i, row, number, seat_type: 'CLASSIC' };
          }));
        } else {
          setError('Secure booking slot not found.');
        }
      } else {
        setError('Failed to fetch transaction log.');
      }
    } catch (e) {
      setError('Network error syncing payment ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !isCheckoutMode) {
      fetchBookingDetails();
    }
  }, [bookingId, token, isCheckoutMode]);

  // 3. Set up countdown timer based on expiry time
  useEffect(() => {
    if (!booking || isCheckoutMode) return;
    
    const calculateTimeLeft = () => {
      const difference = new Date(booking.expires_at).getTime() - new Date().getTime();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    timerRef.current = setInterval(() => {
      const remain = calculateTimeLeft();
      setTimeLeft(remain);
      
      if (remain <= 0) {
        clearInterval(timerRef.current);
        handleExpiry();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [booking, isCheckoutMode]);

  const handleExpiry = async () => {
    setError('Your 5-minute seat lock has expired. Please search again.');
    try {
      await fetch(`${API_BASE}/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async () => {
    if (window.confirm("Are you sure you want to cancel this checkout? Your seats will be released.")) {
      try {
        await fetch(`${API_BASE}/bookings/${bookingId}/cancel/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
        navigate(-1);
      } catch (e) {
        navigate(-1);
      }
    }
  };

  // 4. Checkout lock action (transition from Phase 1 to Phase 2)
  const handleLockSeatsCheckout = async () => {
    setError('');
    
    // Validate split emails if split is active
    let emails = [];
    if (isSplitActive) {
      emails = splitEmails.map(e => e.trim()).filter(e => e !== '');
      if (emails.length === 0) {
        setError('Please enter at least one friend email for the group split.');
        return;
      }
      // Simple email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          setError(`Invalid email address format: ${email}`);
          return;
        }
      }
    }

    setPaymentRunning(true);
    const showId = show?.id;
    if (!showId) {
      setError('Unable to parse movie show reference ID.');
      setPaymentRunning(false);
      return;
    }

    try {
      const seatIds = selectedSeats.map(s => s.seat_id);
      const foodItemsPayload = Object.keys(quantities)
        .map(id => ({ id: parseInt(id), quantity: quantities[id] }))
        .filter(item => item.quantity > 0);

      const response = await fetch(`${API_BASE}/shows/${showId}/lock-seats/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          seat_ids: seatIds,
          food_items: foodItemsPayload,
          use_points: usePoints,
          coupon: appliedCoupon,
          split_emails: emails
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Clear configuration inputs
        setAppliedCoupon('');
        setCouponCode('');
        
        // Initialize Stripe if real keys provided
        if (data.stripe_public_key) {
          setStripePromise(loadStripe(data.stripe_public_key));
        }

        // Redirect to same page but with real booking ID now
        navigate(`/bookings/${data.booking_id}/pay`, { 
          state: { 
            bookingData: {
              booking_id: data.booking_id,
              stripe_client_secret: data.stripe_client_secret,
              stripe_public_key: data.stripe_public_key,
              payment_intent_id: data.payment_intent_id,
              total_amount: data.total_amount,
              is_demo: data.is_demo,
              expires_at: data.expires_at,
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
              group_booking: isSplitActive ? {
                amount_per_person: data.amount_per_person,
                splits: emails.map((email, idx) => ({ id: idx, email, amount: data.amount_per_person, status: 'PENDING' }))
              } : null,
              seats: selectedSeats.map(s => `${s.row}${s.number}`)
            }, 
            showData: show, 
            seats: selectedSeats 
          } 
        });
      } else {
        setError(data.error || data.detail || 'Failed to lock seats or complete configuration.');
      }
    } catch (e) {
      setError('Connection timeout establishing seat matrix lock.');
    } finally {
      setPaymentRunning(false);
    }
  };

  // 5. Demo payment success bypass
  const handleDemoPaymentSuccess = async () => {
    setError('');
    setPaymentRunning(true);
    verifyPaymentOnBackend({
      booking_id: booking.booking_id,
      demo_success: true,
      payment_intent_id: booking.payment_intent_id || `pi_demo_${Math.random().toString(36).substr(2, 9)}`
    });
  };

  // 6. Backend verify payment
  const verifyPaymentOnBackend = async (payload) => {
    try {
      const response = await fetch(`${API_BASE}/bookings/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        clearInterval(timerRef.current);
        navigate(`/bookings/${booking.booking_id}/success`, { state: { booking: data.booking } });
      } else {
        setError(data.error || 'Payment validation failed.');
      }
    } catch (e) {
      setError('Connection failure validating booking confirmation.');
    } finally {
      setPaymentRunning(false);
    }
  };

  // 7. Simulate Split Member Payments (Developer Testing Helper)
  const handleSimulateSplitPayment = async (splitId) => {
    try {
      const response = await fetch(`${API_BASE}/bookings/split-pay/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ split_id: splitId, demo_success: true })
      });
      if (response.ok) {
        // Refresh details
        fetchBookingDetails();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to simulate split payment.');
      }
    } catch (err) {
      console.error(err);
      alert('Split pay connection failure.');
    }
  };

  // Helper selectors for quantities
  const handleQtyChange = (itemId, change) => {
    setQuantities(prev => {
      const nextVal = (prev[itemId] || 0) + change;
      return {
        ...prev,
        [itemId]: Math.max(0, nextVal)
      };
    });
  };

  // Helper split emails configuration
  const handleAddEmailField = () => {
    setSplitEmails([...splitEmails, '']);
  };

  const handleEmailChange = (index, value) => {
    const next = [...splitEmails];
    next[index] = value;
    setSplitEmails(next);
  };

  const handleRemoveEmailField = (index) => {
    const next = [...splitEmails];
    next.splice(index, 1);
    setSplitEmails(next.length === 0 ? [''] : next);
  };

  // Apply Coupon CYBER50 code client side feedback
  const handleApplyCouponCode = () => {
    setCouponError('');
    if (couponCode.trim().toUpperCase() === 'CYBER50') {
      setAppliedCoupon('CYBER50');
    } else {
      setAppliedCoupon('');
      setCouponError('Invalid promo code. Try: CYBER50');
    }
  };

  // Base Prices Calculator
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
      const qty = quantities[item.id] || 0;
      return sum + (item.price * qty);
    }, 0);
  };

  const getPromoDiscount = () => {
    if (appliedCoupon === 'CYBER50') {
      const tickets = calculateTicketTotal();
      return Math.min(tickets * 0.5, 200); // 50% max 200
    }
    return 0;
  };

  const getPointsRedemptionVal = (subtotal) => {
    if (usePoints) {
      return Math.min(userPoints, subtotal);
    }
    return 0;
  };

  const calculateFinalTotal = () => {
    const sub = calculateTicketTotal() + calculateFoodTotal() - getPromoDiscount();
    return Math.max(0, sub - getPointsRedemptionVal(sub));
  };

  const getIndividualSplitPortion = () => {
    const finalTotal = calculateFinalTotal();
    if (isSplitActive) {
      const count = splitEmails.map(e => e.trim()).filter(e => e !== '').length + 1;
      return finalTotal / count;
    }
    return finalTotal;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber text-glow-cyan">RETRIEVING SECURE CHECKOUT FREQUENCY...</span>
      </div>
    );
  }

  if (!isCheckoutMode && !booking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber text-glow-cyan">SYNCHRONIZING TRANSACTION RECORD...</span>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isExpired = timeLeft <= 0;

  // Render check state
  if (isCheckoutMode) {
    if (!show || selectedSeats.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--cyber-magenta)' }}>Checkout Session Expired or Empty</h2>
          <Link to="/" className="cyber-btn cyber-btn-cyan" style={{ marginTop: '20px' }}>Return to Catalogue</Link>
        </div>
      );
    }

    return (
      <main style={{ padding: '20px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Left Side: Snacks, Coupons, Split configuration */}
          <div style={{ flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* Canteen snacks */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Award size={20} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '15px', margin: 0 }}>CYBER CANTEEN SNACKS</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '-5px', marginBottom: '20px' }}>
                Pre-order high-energy canteen snacks to automatically unlock the <strong>Snack Commander</strong> operator badge.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {foodItemsList.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'white' }}>{item.name}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0' }}>{item.description}</span>
                      <strong style={{ fontSize: '13px', color: 'var(--cyber-cyan)' }}>INR {parseFloat(item.price).toFixed(2)}</strong>
                    </div>
                    {/* Counter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => handleQtyChange(item.id, -1)}
                        style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-cyber" style={{ fontSize: '14px', width: '15px', textAlign: 'center' }}>
                        {quantities[item.id] || 0}
                      </span>
                      <button 
                        onClick={() => handleQtyChange(item.id, 1)}
                        style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupons */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Percent size={20} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '15px', margin: 0 }}>PROMO COUPONS</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code (e.g. CYBER50)"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    color: 'white',
                    outline: 'none',
                    fontSize: '13px'
                  }}
                />
                <button 
                  onClick={handleApplyCouponCode}
                  className="cyber-btn cyber-btn-cyan"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '12px' }}
                >
                  APPLY
                </button>
              </div>
              {appliedCoupon && (
                <div style={{ color: '#00ff66', fontSize: '12px', marginTop: '10px', fontWeight: 600 }}>
                  Active Coupon: {appliedCoupon} (50% off ticket base price applied!)
                </div>
              )}
              {couponError && (
                <div style={{ color: 'var(--cyber-magenta)', fontSize: '12px', marginTop: '10px' }}>
                  {couponError}
                </div>
              )}
            </div>

            {/* Gamification Points */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Award size={20} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '15px', margin: 0 }}>OPERATOR REWARDS</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 15px 0' }}>
                Accumulate reward points (10% back) on all confirms. Redeem points instantly (1 point = 1 INR).
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'white' }}>
                <input 
                  type="checkbox" 
                  checked={usePoints} 
                  onChange={(e) => setUsePoints(e.target.checked)}
                  disabled={userPoints === 0}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--cyber-cyan)' }}
                />
                <span>Redeem points balance (Available: <strong style={{ color: 'var(--cyber-cyan)' }}>{userPoints} PTS</strong>)</span>
              </label>
            </div>

            {/* Group booking splits */}
            <div className="glass-panel" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Users size={20} style={{ color: 'var(--cyber-cyan)' }} />
                <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '15px', margin: 0 }}>GROUP SPLIT BOOKING</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 15px 0' }}>
                Checkbox "Initiate Split" to divide bill with friends. Unlocks the <strong>Squad Leader</strong> badge.
              </p>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'white', marginBottom: isSplitActive ? '20px' : 0 }}>
                <input 
                  type="checkbox" 
                  checked={isSplitActive} 
                  onChange={(e) => setIsSplitActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--cyber-cyan)' }}
                />
                <span>Initiate Group Split Payment</span>
              </label>

              {isSplitActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '15px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>FRIEND EMAIL ADDRESSES</span>
                  {splitEmails.map((email, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        placeholder={`Friend ${idx + 1} Email`}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-glass)',
                          color: 'white',
                          outline: 'none',
                          fontSize: '13px'
                        }}
                      />
                      <button 
                        onClick={() => handleRemoveEmailField(idx)}
                        style={{ padding: '10px', background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--cyber-magenta)', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddEmailField}
                    className="cyber-btn cyber-btn-cyan"
                    style={{ padding: '8px 16px', alignSelf: 'flex-start', fontSize: '11px', borderRadius: '6px' }}
                  >
                    + ADD MEMBER
                  </button>

                  {/* Split Preview ledger */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px', marginTop: '10px', border: '1px dashed var(--border-glass)', fontSize: '13px' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>SPLIT PORTION breakdown:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', padding: '4px 0' }}>
                      <span>You (Initiator):</span>
                      <strong>INR {getIndividualSplitPortion().toFixed(2)}</strong>
                    </div>
                    {splitEmails.map((e, i) => e.trim() !== '' && (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', padding: '4px 0' }}>
                        <span>{e.trim()}:</span>
                        <strong>INR {getIndividualSplitPortion().toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Configuration Checkout Summary Card */}
          <div className="glass-panel" style={{ flex: '0 0 320px', padding: '25px', display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', background: 'rgba(13,15,30,0.75)' }}>
            <h3 className="font-cyber text-glow-cyan" style={{ fontSize: '15px', margin: '0 0 15px 0' }}>CHECKOUT MATRIX</h3>
            
            {/* Show Details */}
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--border-glass)' }}>
              <strong style={{ color: 'white', fontSize: '15px', display: 'block', marginBottom: '4px' }}>{show.movie_title}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{show.cinema_name} &bull; {show.screen_name}</span>
            </div>

            {/* Bill details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Seats ({selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}):</span>
                <span style={{ color: 'white' }}>INR {calculateTicketTotal().toFixed(2)}</span>
              </div>
              
              {calculateFoodTotal() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Canteen Snacks:</span>
                  <span style={{ color: 'white' }}>INR {calculateFoodTotal().toFixed(2)}</span>
                </div>
              )}

              {getPromoDiscount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cyber-cyan)' }}>
                  <span>Promo Discount (CYBER50):</span>
                  <span>-INR {getPromoDiscount().toFixed(2)}</span>
                </div>
              )}

              {getPointsRedemptionVal(calculateTicketTotal() + calculateFoodTotal() - getPromoDiscount()) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cyber-cyan)' }}>
                  <span>Points Redeemed:</span>
                  <span>-INR {getPointsRedemptionVal(calculateTicketTotal() + calculateFoodTotal() - getPromoDiscount()).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Final Total */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>Final Total Bill:</span>
                <span className="font-cyber text-glow-cyan" style={{ fontSize: '20px', fontWeight: 900 }}>
                  INR {calculateFinalTotal().toFixed(2)}
                </span>
              </div>
              
              {isSplitActive && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px', color: 'var(--cyber-magenta)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Your Split Portion (1 member):</span>
                  <strong className="font-cyber" style={{ fontSize: '14px' }}>INR {getIndividualSplitPortion().toFixed(2)}</strong>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 0, 127, 0.08)', border: '1px solid var(--cyber-magenta)', color: 'var(--cyber-magenta)', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '15px' }}>
                {error}
              </div>
            )}

            <button 
              onClick={handleLockSeatsCheckout}
              disabled={paymentRunning}
              className="cyber-btn font-cyber"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '13px' }}
            >
              <CreditCard size={15} />
              {paymentRunning ? 'SEALING LOCK MATRIX...' : 'LOCK SEATS & CHECKOUT'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '12px', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={12} style={{ color: 'var(--cyber-cyan)' }} />
              <span>5-min seating hold starts after locking.</span>
            </div>
          </div>

        </div>
      </main>
    );
  }

  // Render Payment Mode (Phase 2)
  return (
    <div style={{ minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0, padding: '0 0 60px 0' }}>
      
      {/* 1. Header Navigation Bar */}
      <div style={{ background: 'rgba(13,15,30,0.8)', borderBottom: '1px solid var(--border-glass)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={handleCancelBooking}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' }}
        >
          <span style={{ color: 'var(--cyber-cyan)' }}>&larr; BACK</span>
        </button>
        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>SELECT SEATS</span>
          <span>&gt;</span>
          <span>CHOOSE CINEMA</span>
          <span>&gt;</span>
          <span>GRAB FOOD</span>
          <span>&gt;</span>
          <span style={{ color: 'var(--cyber-cyan)', borderBottom: '2px solid var(--cyber-cyan)', paddingBottom: '3px' }}>PAYMENT</span>
        </div>
      </div>
      
      {/* 2. Main Page Grid */}
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Booking details, Offers & Payment Methods */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Booking Summary Card */}
          <div className="glass-panel" style={{ padding: '25px', background: '#1A1917', border: '1.5px solid #C5A880' }}>
            <h4 style={{ fontSize: '12px', color: '#D4AF37', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0', fontWeight: '800' }}>BOOKING SUMMARY</h4>
            
            {/* Show Details */}
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
              <strong style={{ color: '#F5F5F7', fontSize: '16px', display: 'block', marginBottom: '4px' }}>{show?.movie_title}</strong>
              <span style={{ fontSize: '13px', color: '#C5A880', display: 'block' }}>{show?.cinema_name} &bull; {show?.screen_name}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                {show ? new Date(show.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : ''} &bull; {show?.start_time ? show.start_time.substring(0, 5) : ''}
              </span>
            </div>

            {/* Ticket Seats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#F5F5F7', marginBottom: '12px' }}>
              <span>Seats: <strong style={{ color: '#D4AF37' }}>{booking?.seats ? booking.seats.join(', ') : selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</strong></span>
              <strong>INR {(booking ? (booking.total_amount - (booking.booking_foods || []).reduce((sum, f) => sum + (parseFloat(f.price) * f.quantity), 0)) : calculateTicketTotal()).toFixed(2)}</strong>
            </div>

            {/* Food Add-ons */}
            {booking?.booking_foods && booking.booking_foods.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>FOOD & BEVERAGES</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {booking.booking_foods.map(item => (
                    <div key={item.id || item.food_item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <span>{item.name} <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>x{item.quantity}</span></span>
                      <strong style={{ color: '#F5F5F7' }}>INR {(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split billing if active */}
            {booking?.group_booking && (
              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '12px', paddingBottom: '12px', fontSize: '12px', color: '#C5A880' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Group Split Bill Total:</span>
                  <strong>INR {booking.total_amount.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FFB300', fontWeight: 'bold' }}>
                  <span>Your share (1 Person):</span>
                  <strong>INR {parseFloat(booking.group_booking.amount_per_person).toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div style={{ borderTop: '2px solid rgba(212, 175, 55, 0.2)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14px', color: '#F5F5F7', fontWeight: 'bold' }}>Total Payable Amount:</span>
              <span className="font-cyber text-glow-cyan" style={{ fontSize: '18px', fontWeight: '900', color: '#D4AF37' }}>
                INR {(booking ? booking.total_amount : calculateTicketTotal()).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Offers */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--cyber-cyan)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0', fontWeight: '800' }}>OFFERS & PROMOTIONS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Bank Offers', icon: '🏦' },
                { name: 'Star Pass', icon: '⭐' },
                { name: 'M-Coupon', icon: '🎟️' },
                { name: 'Promocode', icon: '🏷️' },
                { name: 'Privilege Plus', icon: '💎' }
              ].map(offer => (
                <div key={offer.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-glass)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: 'white', background: 'rgba(255,255,255,0.01)' }}>
                  <span>{offer.icon}</span>
                  <span>{offer.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '11px', color: 'var(--cyber-cyan)', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 15px 0', fontWeight: '800' }}>PAYMENT METHODS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Credit Card', icon: '💳' },
                { name: 'Debit Card', icon: '💳' },
                { name: 'Net Banking', icon: '🏦' },
                { name: 'UPI', icon: '📱' },
                { name: 'Gift Card', icon: '🎁' },
                { name: 'Gyftr', icon: '🎟️' }
              ].map(method => {
                const isActive = activePaymentMethod === method.name;
                return (
                  <div 
                    key={method.name} 
                    onClick={() => setActivePaymentMethod(method.name)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '12px 15px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-glass)',
                      color: isActive ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{method.icon}</span>
                    <span>{method.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Total Amount & Payment Form */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Header Paid amount */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>To be Paid:</span>
            <strong className="text-glow-cyan font-cyber" style={{ fontSize: '20px', color: 'var(--cyber-cyan)' }}>
              ₹{(booking ? (booking.group_booking ? parseFloat(booking.group_booking.amount_per_person) : booking.total_amount) : 0).toFixed(2)}
            </strong>
          </div>

          {/* Timer Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpired ? 'rgba(255, 0, 127, 0.1)' : 'rgba(123, 44, 191, 0.1)', border: '1px solid', borderColor: isExpired ? 'var(--cyber-magenta)' : 'var(--cyber-purple)', borderRadius: '8px', padding: '12px 20px', fontSize: '13px' }}>
            <span style={{ fontWeight: 'bold', color: isExpired ? 'var(--cyber-magenta)' : 'var(--cyber-cyan)' }}>
              {isExpired ? 'LOCK PROTOCOL EXPIRED' : 'SEATING LOCK TIMER ACTIVE'}
            </span>
            <strong className="font-cyber text-glow-cyan" style={{ fontSize: '16px', color: isExpired ? 'var(--cyber-magenta)' : 'var(--cyber-cyan)' }}>
              {formatTime(timeLeft)}
            </strong>
          </div>

          {/* Main Form container */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            {/* Form Header */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--border-glass)', padding: '15px 25px' }}>
              <h3 className="font-cyber text-glow-cyan" style={{ margin: 0, fontSize: '15px', color: 'white', fontWeight: 'bold' }}>
                Pay via {activePaymentMethod}
              </h3>
            </div>

            {/* Form Body */}
            <div style={{ padding: '30px' }}>
              {error && (
                <div style={{ background: 'rgba(255, 0, 127, 0.08)', border: '1px solid var(--cyber-magenta)', color: 'var(--cyber-magenta)', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              {/* RENDER DYNAMIC FORM BASED ON PAYMENT METHOD */}
              {(activePaymentMethod === 'Credit Card' || activePaymentMethod === 'Debit Card') && (
                <StripeCardForm
                  booking={booking}
                  stripePromise={stripePromise}
                  cardName={cardName}
                  setCardName={setCardName}
                  saveCard={saveCard}
                  setSaveCard={setSaveCard}
                  paymentRunning={paymentRunning}
                  setPaymentRunning={setPaymentRunning}
                  error={error}
                  setError={setError}
                  verifyPaymentOnBackend={verifyPaymentOnBackend}
                  handleDemoPaymentSuccess={handleDemoPaymentSuccess}
                  isExpired={isExpired}
                />
              )}

              {activePaymentMethod === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter UPI ID (e.g. username@bank)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: 'var(--bg-secondary)',
                      color: 'white'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    A collect request will be sent to your UPI app. Please verify and pay inside the app.
                  </p>
                  {!isExpired && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button 
                        onClick={() => {
                          if (!upiId) { setError('Please enter your UPI ID.'); return; }
                          handleDemoPaymentSuccess();
                        }}
                        disabled={paymentRunning}
                        className="cyber-btn font-cyber"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, var(--cyber-cyan) 0%, #00d2fe 100%)',
                          color: 'var(--bg-primary)',
                          justifyContent: 'center',
                          padding: '15px',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {paymentRunning ? 'Processing...' : 'Verify & Pay via UPI'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activePaymentMethod === 'Net Banking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Select Your Bank:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(bank => (
                      <label key={bank} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: selectedBank === bank ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)', borderColor: selectedBank === bank ? 'var(--cyber-cyan)' : 'var(--border-glass)', color: 'white' }}>
                        <input 
                          type="radio" 
                          name="bank" 
                          value={bank}
                          checked={selectedBank === bank}
                          onChange={() => setSelectedBank(bank)}
                          style={{ accentColor: 'var(--cyber-cyan)' }}
                        />
                        <span>{bank}</span>
                      </label>
                    ))}
                  </div>
                  {!isExpired && (
                    <button 
                      onClick={() => {
                        if (!selectedBank) { setError('Please select a bank.'); return; }
                        handleDemoPaymentSuccess();
                      }}
                      disabled={paymentRunning}
                      className="cyber-btn font-cyber"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, var(--cyber-cyan) 0%, #00d2fe 100%)',
                        color: 'var(--bg-primary)',
                        justifyContent: 'center',
                        padding: '15px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      {paymentRunning ? 'Processing...' : 'Proceed to Net Banking'}
                    </button>
                  )}
                </div>
              )}

              {(activePaymentMethod === 'Gift Card' || activePaymentMethod === 'Gyftr') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Voucher / Gift Card Code"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: 'var(--bg-secondary)',
                      color: 'white'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    Voucher amount will be applied instantly. Any remainder must be paid using another method.
                  </p>
                  {!isExpired && (
                    <button 
                      onClick={handleDemoPaymentSuccess}
                      disabled={paymentRunning}
                      className="cyber-btn font-cyber"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, var(--cyber-cyan) 0%, #00d2fe 100%)',
                        color: 'var(--bg-primary)',
                        justifyContent: 'center',
                        padding: '15px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {paymentRunning ? 'Processing...' : 'Apply Voucher & Pay'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cancel Booking & Seats info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            <span>Selected Seats: <strong>{booking && booking.seats ? booking.seats.join(', ') : selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</strong></span>
            <button 
              onClick={handleCancelBooking}
              style={{ background: 'none', border: 'none', color: 'var(--cyber-magenta)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel & Release Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stripe Card Form Sub-Component ───────────────────────────────────────────
const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#8e9bb3' }
    },
    invalid: { color: 'var(--cyber-magenta)', iconColor: 'var(--cyber-magenta)' }
  }
};

const ELEMENT_CONTAINER_STYLE = {
  padding: '12px 15px',
  border: '1px solid var(--border-glass)',
  borderRadius: '8px',
  background: 'var(--bg-secondary)',
  boxSizing: 'border-box'
};

function StripeCardFormInner({ booking, cardName, setCardName, saveCard, setSaveCard, paymentRunning, setPaymentRunning, error, setError, verifyPaymentOnBackend, handleDemoPaymentSuccess, isExpired }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripePayment = async () => {
    setError('');
    if (!cardName.trim()) {
      setError('Please enter the name on the card.');
      return;
    }

    // Demo mode — no real Stripe keys, bypass directly
    if (booking.is_demo || !booking.stripe_client_secret) {
      handleDemoPaymentSuccess();
      return;
    }

    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please wait.');
      return;
    }

    setPaymentRunning(true);
    const cardNumberElement = elements.getElement(CardNumberElement);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      booking.stripe_client_secret,
      {
        payment_method: {
          card: cardNumberElement,
          billing_details: { name: cardName }
        }
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setPaymentRunning(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Send PI id to backend for verification
      verifyPaymentOnBackend({
        booking_id: booking.booking_id,
        payment_intent_id: paymentIntent.id,
        demo_success: false
      });
    } else {
      setError('Payment incomplete. Please try again.');
      setPaymentRunning(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Card Number */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Card Number</label>
        <div style={ELEMENT_CONTAINER_STYLE}>
          {booking && !booking.is_demo ? (
            <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
          ) : (
            <input
              type="text"
              defaultValue="4242 4242 4242 4242"
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#ffffff', background: 'transparent', boxSizing: 'border-box' }}
            />
          )}
        </div>
        {booking && booking.is_demo && (
          <p style={{ fontSize: '11px', color: '#00ff66', margin: '4px 0 0 0' }}> Demo mode &nbsp; use test card <strong>4242 4242 4242 4242</strong></p>
        )}
      </div>

      {/* Expiry & CVC */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Expiry Date</label>
          <div style={ELEMENT_CONTAINER_STYLE}>
            {booking && !booking.is_demo ? (
              <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
            ) : (
              <input type="text" defaultValue="12 / 29" placeholder="MM / YY" maxLength={7} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#ffffff', background: 'transparent', boxSizing: 'border-box' }} />
            )}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>CVC</label>
          <div style={ELEMENT_CONTAINER_STYLE}>
            {booking && !booking.is_demo ? (
              <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
            ) : (
              <input type="text" defaultValue="123" placeholder="CVC" maxLength={4} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#ffffff', background: 'transparent', boxSizing: 'border-box' }} />
            )}
          </div>
        </div>
      </div>

      {/* Name on Card */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Name on Card</label>
        <input 
          type="text" 
          placeholder="Name on the card"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px',
            border: '1px solid var(--border-glass)',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            background: 'var(--bg-secondary)',
            color: 'white'
          }}
        />
      </div>

      {/* Save card */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <input 
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          style={{ width: '15px', height: '15px', accentColor: 'var(--cyber-cyan)' }}
        />
        <span>Securely save this card for future use</span>
      </label>

      {/* Stripe badge */}
      {booking && !booking.is_demo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={12} style={{ color: 'var(--cyber-cyan)' }} />
          <span>Secured by <strong style={{ color: 'var(--cyber-cyan)' }}>Stripe</strong> — PCI DSS Compliant</span>
        </div>
      )}

      {/* ACTION BUTTONS */}
      {!isExpired && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={handleStripePayment}
            disabled={paymentRunning}
            className="cyber-btn font-cyber"
            style={{
              width: '100%',
              background: paymentRunning ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--cyber-cyan) 0%, #00d2fe 100%)',
              color: 'var(--bg-primary)',
              justifyContent: 'center',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              cursor: paymentRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-neon-cyan)',
              transition: 'background 0.2s'
            }}
          >
            {paymentRunning ? '⟳ Processing Payment...' : '🔒 Verify & Pay'}
          </button>

          {booking && booking.is_demo && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
                <div style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }} />
                <span>OR DEV BYPASS</span>
                <div style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }} />
              </div>
              <button 
                onClick={handleDemoPaymentSuccess}
                disabled={paymentRunning}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'transparent',
                  border: '1px dashed var(--border-glass)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ⚡ Quick Simulate Success (Demo Bypass)
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

// Stripe publishable key (Test Mode) — loaded once at module level
const _demoStripePromise = loadStripe('pk_test_51TfzxWF598wIEkR4CSox9YGHHduAhBF96InZDnoOsRbtgZEVpEjDz557lWnS3xyjxiBjL0S0dvSEMJcGX9sK0lnR00HA7coqlP');

function StripeCardForm(props) {
  const { stripePromise } = props;
  // Always wrap in <Elements> so useStripe/useElements hooks never throw.
  // In demo mode we load a harmless public test key; in real mode we use the actual key.
  const sp = stripePromise || _demoStripePromise;
  return (
    <Elements stripe={sp}>
      <StripeCardFormInner {...props} />
    </Elements>
  );
}
