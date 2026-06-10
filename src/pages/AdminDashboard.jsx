import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { 
  Shield, Plus, TrendingUp, Calendar, Video, Monitor, 
  AlertCircle, CheckCircle, HelpCircle, Users, Gift, 
  Radio, Server, Download, Trash, RefreshCw, CheckCircle2, 
  AlertTriangle, Settings, Coffee, Award, Edit3, QrCode, Bell, X,
  LayoutDashboard, IndianRupee, History, Camera, FileSpreadsheet, Play, StopCircle, Volume2,
  ScanLine, Search, Filter, LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const { token, API_BASE, user, loading: authLoading, isAdminAuthenticated, adminUser, adminRole, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated as admin
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  // Mode switcher: 'superadmin' (Platform Operations) vs 'cinema' (Cinema Manager)
  const [consoleMode, setConsoleMode] = useState('superadmin');
  
  // Custom states for upgraded console operations
  const [editingCinema, setEditingCinema] = useState(null);
  const [showEditCinemaModal, setShowEditCinemaModal] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState([]);
  const [showUserBookingsModal, setShowUserBookingsModal] = useState(false);
  const [cinemaTabFilter, setCinemaTabFilter] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'SUSPENDED'

  // Shared status/feedback states
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Data lists
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [offersList, setOffersList] = useState([]);

  // Super Admin creation states
  const [newCinema, setNewCinema] = useState({ name: '', address: '', city_name: 'Delhi' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_amount: 50, expiry_date: '' });
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  
  // Cinema Manager creation states
  const [newScreen, setNewScreen] = useState({ cinema_id: '', name: '', rows: 'A,B,C,D,E', cols: 8 });
  const [newMovie, setNewMovie] = useState({ title: '', description: '', duration: 120, language: 'English', genre: 'Action, Sci-Fi', poster_url: '', release_date: '' });
  const [newShow, setNewShow] = useState({ movie_id: '', screen_id: '', date: '', start_time: '', end_time: '', classic_price: 150, premium_price: 250, recliner_price: 450 });
  const [newOffer, setNewOffer] = useState({ cinema_id: '', code: '', discount_percentage: 15, valid_from: '', valid_to: '', description: '' });
  const [newFood, setNewFood] = useState({ name: '', price: 100, description: '', image_url: '' });

  // Active toggles / details
  const [showAddCinema, setShowAddCinema] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  
  // Validation QR
  const [validationToken, setValidationToken] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [scanningSimOpen, setScanningSimOpen] = useState(false);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const qrScannerDivRef = useRef(null);

  // Scan Logs state
  const [scanLogs, setScanLogs] = useState([]);
  const [scanLogsLoading, setScanLogsLoading] = useState(false);
  const [scanLogSearch, setScanLogSearch] = useState('');
  const [scanLogStatusFilter, setScanLogStatusFilter] = useState('ALL');

  // Customer Alert
  const [alertShowId, setAlertShowId] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Booking logs search/filter
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  // System parameters
  const [sysParams, setSysParams] = useState({ default_commission: 10.0, convenience_fee: 30.0, smtp_enabled: true });

  // Upgraded Cinema Console states
  const [theatreProfile, setTheatreProfile] = useState({
    name: 'CineNova Multiplex',
    address: '4th Floor, Nexus Mall, Kora Mangala',
    city: 'Bengaluru',
    email: 'contact@cinenova.com',
    phone: '+91 98765 43210',
    facilities: ['Dolby Atmos Audio', 'IMAX Cinema 3D', 'Premium Recliner Seats', 'Wheelchair Accessible Rooms', 'Valet Parking Lot', 'Gourmet Food Canteen']
  });
  const [pricingRules, setPricingRules] = useState([
    { id: 1, name: 'Morning Show Discount', type: 'time', condition: 'Before 12:00 PM', multiplier: 0.85 },
    { id: 2, name: 'Weekend Peak Surge', type: 'weekend', condition: 'Fri - Sun Shows', multiplier: 1.15 },
    { id: 3, name: 'High Occupancy Surge', type: 'occupancy', condition: 'Occupancy > 80%', multiplier: 1.10 }
  ]);
  const [newRule, setNewRule] = useState({ name: '', type: 'time', condition: '', multiplier: 1.0 });
  const [foodList, setFoodList] = useState([]);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  };

  // Redirect if not logged in or lacks permissions
  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        navigate('/login');
      } else if (user) {
        if (user.role === 'USER') {
          navigate('/');
        } else if (user.role === 'SUPERADMIN') {
          if (consoleMode !== 'superadmin') {
            setConsoleMode('superadmin');
            setActiveTab('metrics');
          }
        } else if (user.role === 'THEATRE_ADMIN') {
          if (consoleMode !== 'cinema') {
            setConsoleMode('cinema');
            setActiveTab('cinema_metrics');
          }
        }
      }
    }
  }, [token, user, authLoading, consoleMode]);

  // Load all initial data depending on consoleMode
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Stats and Movies are shared
      const statsRes = await fetch(`${API_BASE}/admin/stats/`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const moviesRes = await fetch(`${API_BASE}/movies/?all=true`, { headers });
      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        setMovies(moviesData);
        if (moviesData.length > 0 && !newShow.movie_id) {
          setNewShow(prev => ({ ...prev, movie_id: moviesData[0].id }));
        }
      }

      // 2. Cinemas
      const cinemasRes = await fetch(`${API_BASE}/admin/cinemas/`, { headers });
      if (cinemasRes.ok) {
        const cinemasData = await cinemasRes.json();
        setCinemas(cinemasData);
        if (cinemasData.length > 0) {
          setNewScreen(prev => ({ ...prev, cinema_id: cinemasData[0].id }));
          setNewOffer(prev => ({ ...prev, cinema_id: cinemasData[0].id }));
          if (activeTab === 'screens' && !selectedScreenId) {
            fetchScreens(cinemasData[0].id);
          }
        }
      }

      // 3. Tab specific fetches
      if (consoleMode === 'superadmin') {
        if (activeTab === 'users') {
          const usersRes = await fetch(`${API_BASE}/admin/users/`, { headers });
          if (usersRes.ok) setUsersList(await usersRes.json());
        } else if (activeTab === 'coupons') {
          const couponsRes = await fetch(`${API_BASE}/admin/coupons/`, { headers });
          if (couponsRes.ok) setCouponsList(await couponsRes.json());
        }
      } else {
        if (activeTab === 'bookings') {
          const bookingsRes = await fetch(`${API_BASE}/cinema/bookings/`, { headers });
          if (bookingsRes.ok) setBookingsList(await bookingsRes.json());
        } else if (activeTab === 'offers') {
          const offersRes = await fetch(`${API_BASE}/cinema/offers/`, { headers });
          if (offersRes.ok) setOffersList(await offersRes.json());
        } else if (activeTab === 'canteen') {
          const foodRes = await fetch(`${API_BASE}/food/`, { headers });
          if (foodRes.ok) setFoodList(await foodRes.json());
        }
      }

    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchScreens = async (cinemaId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/screens/?cinema=${cinemaId}`, { headers });
      if (response.ok) {
        const screensData = await response.json();
        setScreens(screensData);
        if (screensData.length > 0 && !newShow.screen_id) {
          setNewShow(prev => ({ ...prev, screen_id: screensData[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, consoleMode, activeTab]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // --- SUPER ADMIN HANDLERS ---
  const handleCreateCinema = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/cinemas/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCinema)
      });
      if (res.ok) {
        showMsg(`Cinema "${newCinema.name}" added successfully to registry.`);
        setNewCinema({ name: '', address: '', city_name: 'Delhi' });
        setShowAddCinema(false);
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to add cinema.', 'error');
      }
    } catch (err) {
      showMsg('Network error registering cinema.', 'error');
    }
  };

  const handleApproveCinema = async (cinemaId, action) => {
    try {
      const res = await fetch(`${API_BASE}/admin/cinemas/approve/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cinema_id: cinemaId, action })
      });
      if (res.ok) {
        showMsg(`Cinema status updated: ${action}`);
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to update cinema status.', 'error');
      }
    } catch (err) {
      showMsg('Error updating status.', 'error');
    }
  };

  const handleEditCinemaSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/cinemas/edit/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cinema_id: editingCinema.id,
          name: editingCinema.name,
          address: editingCinema.address,
          commission_rate: editingCinema.commission_rate,
          owner_username: editingCinema.owner_username
        })
      });
      if (res.ok) {
        showMsg('Cinema details updated successfully.');
        setShowEditCinemaModal(false);
        setEditingCinema(null);
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to edit cinema details.', 'error');
      }
    } catch (err) {
      showMsg('Error editing cinema.', 'error');
    }
  };

  const handleDeleteCinema = async (cinemaId) => {
    if (!window.confirm("Are you sure you want to delete this cinema?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/cinemas/delete/?cinema_id=${cinemaId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        showMsg('Cinema deleted successfully.');
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to delete cinema.', 'error');
      }
    } catch (err) {
      showMsg('Error deleting cinema.', 'error');
    }
  };

  const handleApproveMovie = async (movieId, action) => {
    try {
      const res = await fetch(`${API_BASE}/admin/movies/approve/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ movie_id: movieId, action })
      });
      if (res.ok) {
        showMsg(`Movie updated successfully: ${action}`);
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to update movie.', 'error');
      }
    } catch (err) {
      showMsg('Error updating movie.', 'error');
    }
  };

  const fetchUserBookingHistory = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/`, { headers });
      if (res.ok) {
        const users = await res.json();
        const userObj = users.find(u => u.id === userId);
        const bookingsRes = await fetch(`${API_BASE}/cinema/bookings/`, { headers });
        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          const filtered = bookings.filter(b => b.customer_username === userObj.username);
          setSelectedUserBookings(filtered);
          setShowUserBookingsModal(true);
        }
      }
    } catch (e) {
      showMsg('Error fetching booking history.', 'error');
    }
  };

  const handleUserBlock = async (userId, blockBool) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId, block: blockBool })
      });
      if (res.ok) {
        showMsg(blockBool ? 'User accounts deactivated.' : 'User account reactivated.');
        loadDashboardData();
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, is_active: !blockBool }));
        }
      }
    } catch (e) {
      showMsg('Failed to update account status.', 'error');
    }
  };

  const viewUserHistory = async (u) => {
    setSelectedUser(u);
    try {
      const bookingsRes = await fetch(`${API_BASE}/cinema/bookings/`, { headers });
      if (bookingsRes.ok) {
        const allBookings = await bookingsRes.json();
        const filtered = allBookings.filter(b => b.customer_username === u.username);
        setUserBookings(filtered);
      }
    } catch (e) {
      setUserBookings([]);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        showMsg(`Global coupon "${newCoupon.code.toUpperCase()}" created!`);
        setNewCoupon({ code: '', discount_amount: 50, expiry_date: '' });
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to create coupon.', 'error');
      }
    } catch (e) {
      showMsg('Failed to create coupon code.', 'error');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ coupon_id: couponId })
      });
      if (res.ok) {
        showMsg('Coupon deleted successfully.');
        loadDashboardData();
      }
    } catch (e) {
      showMsg('Failed to delete coupon.', 'error');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(broadcast)
      });
      if (res.ok) {
        showMsg('Platform broadcast message successfully sent to notifications!');
        setBroadcast({ title: '', message: '' });
      }
    } catch (e) {
      showMsg('Failed to broadcast message.', 'error');
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/movies/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newMovie.title,
          description: newMovie.description,
          duration_minutes: newMovie.duration,
          language: newMovie.language,
          genre: newMovie.genre,
          poster_url: newMovie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
          release_date: newMovie.release_date || '2026-06-08',
          is_active: true
        })
      });
      if (res.ok) {
        showMsg(`Movie "${newMovie.title}" added directly to active catalog!`);
        setNewMovie({ title: '', description: '', duration: 120, language: 'English', genre: 'Action, Sci-Fi', poster_url: '', release_date: '' });
        loadDashboardData();
      }
    } catch (e) {
      showMsg('Failed to create movie.', 'error');
    }
  };

  // --- CINEMA MANAGER HANDLERS ---
  const handleCreateScreen = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/screens/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cinema_id: parseInt(newScreen.cinema_id),
          name: newScreen.name,
          rows: newScreen.rows.split(','),
          cols: parseInt(newScreen.cols)
        })
      });
      if (res.ok) {
        showMsg('Screen and complete seat layout matrix generated!');
        setNewScreen(prev => ({ ...prev, name: '' }));
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to create screen.', 'error');
      }
    } catch (e) {
      showMsg('Network error generating screen.', 'error');
    }
  };

  const handleAddShow = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/shows/schedule/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newShow)
      });
      if (res.ok) {
        showMsg('Showtime timeline successfully scheduled!');
        setNewShow(prev => ({ ...prev, date: '', start_time: '', end_time: '' }));
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to schedule show.', 'error');
      }
    } catch (e) {
      showMsg('Failed to schedule show.', 'error');
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/food/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newFood)
      });
      if (res.ok) {
        showMsg(`Snack "${newFood.name}" added to cinema canteen catalog!`);
        setNewFood({ name: '', price: 100, description: '', image_url: '' });
        const foodRes = await fetch(`${API_BASE}/food/`, { headers });
        if (foodRes.ok) setFoodList(await foodRes.json());
      } else {
        showMsg('Failed to add food item.', 'error');
      }
    } catch (e) {
      showMsg('Failed to add food item.', 'error');
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm("Are you sure you want to delete this snack item?")) return;
    try {
      const res = await fetch(`${API_BASE}/food/`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ food_id: foodId })
      });
      if (res.ok) {
        showMsg('Snack item deleted successfully.');
        const foodRes = await fetch(`${API_BASE}/food/`, { headers });
        if (foodRes.ok) setFoodList(await foodRes.json());
      } else {
        showMsg('Failed to delete snack item.', 'error');
      }
    } catch (e) {
      showMsg('Error deleting snack item.', 'error');
    }
  };

  const handleUpdateTheatreProfile = (e) => {
    e.preventDefault();
    showMsg('Multiplex profile details updated successfully!');
  };

  const handleCreatePricingRule = (e) => {
    e.preventDefault();
    if (!newRule.name || !newRule.condition || !newRule.multiplier) {
      showMsg('Please fill in all rule fields.', 'error');
      return;
    }
    const rule = {
      id: Date.now(),
      name: newRule.name,
      type: newRule.type,
      condition: newRule.condition,
      multiplier: parseFloat(newRule.multiplier)
    };
    setPricingRules(prev => [...prev, rule]);
    setNewRule({ name: '', type: 'time', condition: '', multiplier: 1.0 });
    showMsg(`Dynamic pricing rule "${rule.name}" created!`);
  };

  const handleDeletePricingRule = (ruleId) => {
    setPricingRules(prev => prev.filter(r => r.id !== ruleId));
    showMsg('Pricing rule deleted.');
  };

  const handleSubmitMovieRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/movies/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newMovie.title,
          description: newMovie.description,
          duration_minutes: newMovie.duration,
          language: newMovie.language,
          genre: newMovie.genre,
          poster_url: newMovie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
          release_date: newMovie.release_date || '2026-06-08',
          is_active: true,
          is_approved: false
        })
      });
      if (res.ok) {
        showMsg(`Film request for "${newMovie.title}" submitted for Super Admin approval!`);
        setNewMovie({ title: '', description: '', duration: 120, language: 'English', genre: 'Action, Sci-Fi', poster_url: '', release_date: '' });
        loadDashboardData();
      } else {
        const err = await res.json();
        showMsg(err.error || 'Failed to submit movie request.', 'error');
      }
    } catch (e) {
      showMsg('Failed to request movie.', 'error');
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/cinema/offers/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newOffer)
      });
      if (res.ok) {
        showMsg(`Multiplex offer "${newOffer.code.toUpperCase()}" registered!`);
        setNewOffer(prev => ({ ...prev, code: '', description: '' }));
        loadDashboardData();
      }
    } catch (e) {
      showMsg('Failed to create offer.', 'error');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      const res = await fetch(`${API_BASE}/cinema/offers/`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ offer_id: offerId })
      });
      if (res.ok) {
        showMsg('Offer deleted successfully.');
        loadDashboardData();
      }
    } catch (e) {
      showMsg('Failed to delete offer.', 'error');
    }
  };

  const handleValidateTicket = async (e) => {
    e.preventDefault();
    setValidationError('');
    setValidationResult(null);
    try {
      const res = await fetch(`${API_BASE}/verify-ticket/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ qr_data: validationToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setValidationResult(data.booking_details);
        showMsg('Check-in granted! Guest admitted.');
        // Refresh scan logs
        fetchScanLogs();
      } else {
        setValidationError(data.error || 'Check-in denied.');
      }
    } catch (err) {
      setValidationError('Failed to validate check-in.');
    }
  };

  // Fetch scan logs from backend
  const fetchScanLogs = useCallback(async () => {
    setScanLogsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scan-logs/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setScanLogs(data);
      }
    } catch (e) {
      console.error('Error fetching scan logs:', e);
    } finally {
      setScanLogsLoading(false);
    }
  }, [token]);

  // Start camera QR scanner
  const startCameraScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-camera-container');
      setScannerInstance(scanner);
      setCameraActive(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR scanned - stop camera and process
          await scanner.stop();
          setCameraActive(false);
          setScannerInstance(null);
          setValidationToken(decodedText);
          setValidationError('');
          setValidationResult(null);
          // Auto-verify the scanned QR
          try {
            const res = await fetch(`${API_BASE}/verify-ticket/`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ qr_data: decodedText })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              setValidationResult(data.booking_details);
              showMsg('CHECK-IN GRANTED — Guest admitted successfully!');
              fetchScanLogs();
            } else {
              setValidationError(data.error || 'Check-in denied.');
            }
          } catch (err) {
            setValidationError('Network error verifying scanned ticket.');
          }
        },
        (errorMessage) => { /* ignore qr scan errors */ }
      );
    } catch (err) {
      console.error('Camera scanner error:', err);
      setValidationError('Camera access denied or unavailable. Please allow camera permissions.');
    }
  };

  const stopCameraScanner = async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.stop();
      } catch (e) { /* already stopped */ }
      setScannerInstance(null);
    }
    setCameraActive(false);
  };

  // Stop camera when leaving validation tab
  useEffect(() => {
    if (activeTab !== 'validation' && cameraActive) {
      stopCameraScanner();
    }
    if (activeTab === 'scan_logs') {
      fetchScanLogs();
    }
  }, [activeTab]);

  // CSV export for scan logs
  const exportScanLogsCSV = () => {
    const filtered = scanLogs.filter(log => {
      const searchMatch = 
        log.booking_id?.toLowerCase().includes(scanLogSearch.toLowerCase()) ||
        log.scanned_by?.toLowerCase().includes(scanLogSearch.toLowerCase()) ||
        log.movie_title?.toLowerCase().includes(scanLogSearch.toLowerCase());
      const statusMatch = scanLogStatusFilter === 'ALL' || log.status === scanLogStatusFilter;
      return searchMatch && statusMatch;
    });
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Booking UUID,Movie,Customer,Scanned By,Scan Time,Status,Device,IP,Remarks\n';
    filtered.forEach(log => {
      csv += `${log.booking_id},"${log.movie_title || ''}","${log.customer || ''}",${log.scanned_by || ''},${log.scan_time},${log.status},"${log.device || ''}",${log.ip_address || ''},"${log.remarks || ''}"\n`;
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'Showzy_ScanLogs_Report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMsg('Scan logs CSV exported successfully!');
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/cinema/notify-customers/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ show_id: parseInt(alertShowId), message: alertMessage })
      });
      if (res.ok) {
        showMsg('Broadcast dispatched to ticket holders!');
        setAlertShowId('');
        setAlertMessage('');
      }
    } catch (e) {
      showMsg('Failed to send alerts.', 'error');
    }
  };

  const triggerCSVExport = () => {
    let csv = "data:text/csv;charset=utf-8,";
    if (activeTab === 'bookings') {
      csv += "ID,Movie,Cinema,Screen,Customer,Seats,Showtime,Paid Amount,Status\\n";
      filteredBookings.forEach(b => {
        csv += `${b.id},"${b.movie_title}","${b.theatre_name}","${b.screen_name}",${b.customer_username},"${b.seats}","${b.showtime}",${b.final_amount},${b.status}\\n`;
      });
    } else {
      csv += "ID,Cinema,Address\\n";
      cinemas.forEach(c => {
        csv += `${c.id},"${c.name}","${c.address}"\\n`;
      });
    }
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.href = uri;
    link.download = `Showzy_${activeTab}_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMsg('CSV report downloaded successfully!');
  };

  const filteredBookings = bookingsList.filter(b => {
    const searchMatch = b.customer_username.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                        b.movie_title.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                        b.id.toString().includes(bookingSearch);
    const statusMatch = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
    return searchMatch && statusMatch;
  });

  const renderVisualLayout = () => {
    if (!selectedScreenId) return null;
    const screen = screens.find(s => s.id === parseInt(selectedScreenId));
    if (!screen) return null;

    const rows = ['VIP', 'A', 'B', 'C', 'D', 'E'];
    const cols = Array.from({ length: 8 }, (_, i) => i + 1);

    return (
      <div className="space-y-4 p-5 bg-[#07080f]/90 border border-zinc-800/50 border border-zinc-800 rounded-2xl">
        <div className="text-center font-bold text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
          SEAT LAYOUT MAP: {screen.name.toUpperCase()}
        </div>
        <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-[#5c5fc8]/40 via-[#5c5fc8] to-[#5c5fc8]/40 rounded-full shadow-sm text-[8px] text-center text-[#ffcc00] tracking-widest uppercase pt-3 mb-8">
          SCREEN DIRECTION
        </div>
        <div className="flex flex-col gap-2.5 items-center">
          {rows.map(row => (
            <div key={row} className="flex gap-2 items-center">
              <span className="w-6 text-[10px] font-bold text-gray-500 text-right pr-2">{row}</span>
              {cols.map(col => {
                let colorClass = "bg-blue-500/10 border-blue-500/30 text-blue-400";
                if (row === 'VIP') colorClass = "bg-yellow-500/10 border-yellow-500/30 text-[#ffcc00]";
                else if (row === 'A' || row === 'B') colorClass = "bg-purple-500/10 border-purple-500/30 text-purple-400";
                return (
                  <div key={col} className={`w-7 h-7 rounded-lg border text-[8px] font-bold flex items-center justify-center cursor-default ${colorClass}`}>
                    {row}{col}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#5c5fc8' }}>
        <p>Loading Dashboard Analytics...</p>
      </div>
    );
  }

return (
    <div className="bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl text-white rounded-3xl border border-zinc-800 shadow-sm overflow-hidden p-8 font-sans">
      {/* Switcher & Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00]">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Platform Operations</h1>
            <p className="text-xs text-zinc-400">Unified management, analytics, and revenue split control center</p>
          </div>
        </div>

        {/* Switcher & Authorized Role */}
        {(!user || (user.role !== 'SUPERADMIN' && user.role !== 'THEATRE_ADMIN')) ? (
          <div className="flex bg-zinc-800/80 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setConsoleMode('superadmin'); setActiveTab('metrics'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${consoleMode === 'superadmin' ? 'bg-[#ffcc00] text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Platform Operations
            </button>
            <button
              onClick={() => { setConsoleMode('cinema'); setActiveTab('cinema_metrics'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${consoleMode === 'cinema' ? 'bg-[#ffcc00] text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Cinema Console
            </button>
          </div>
        ) : (
          <div className="px-4 py-2 bg-[#07080f]/90 border border-zinc-800/50 border border-zinc-800 rounded-xl">
            <span className="text-xs font-bold text-[#ffcc00] uppercase tracking-wide">
              Authorized: {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Theatre Admin'}
            </span>
          </div>
        )}
      </header>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold mb-6 border ${msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDE NAVIGATION */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#07080f]/90 border border-zinc-800/50 border border-zinc-800 rounded-2xl p-4 space-y-6">
            {consoleMode === 'superadmin' ? (
              <>
                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overview</div>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'metrics' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4" /> Analytics
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Management</div>
                  <button
                    onClick={() => setActiveTab('cinemas')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'cinemas' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4" /> Theatres
                    </span>
                    {cinemas.filter(c => c.status === 'PENDING').length > 0 && (
                      <span className="bg-[#ffcc00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {cinemas.filter(c => c.status === 'PENDING').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'users' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" /> Users
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('movies_admin')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'movies_admin' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Video className="w-4 h-4" /> Movies
                    </span>
                    {movies.filter(m => !m.is_approved).length > 0 && (
                      <span className="bg-[#ffcc00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {movies.filter(m => !m.is_approved).length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Finance</div>
                  <button
                    onClick={() => setActiveTab('revenue')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'revenue' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <IndianRupee className="w-4 h-4" /> Revenue
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'coupons' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Gift className="w-4 h-4" /> Rewards & Coupons
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">System</div>
                  <button
                    onClick={() => setActiveTab('broadcast')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'broadcast' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Radio className="w-4 h-4" /> Broadcasts
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${activeTab === 'settings' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Server className="w-4 h-4" /> System Config
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overview</div>
                  <button
                    onClick={() => setActiveTab('cinema_metrics')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'cinema_metrics' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <TrendingUp className="w-4 h-4" /> Multiplex Stats
                  </button>
                  <button
                    onClick={() => setActiveTab('cinema_profile')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'cinema_profile' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Settings className="w-4 h-4" /> Theatre Profile
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Layout & Timeline</div>
                  <button
                    onClick={() => setActiveTab('screens')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'screens' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Monitor className="w-4 h-4" /> Screens Layout
                  </button>
                  <button
                    onClick={() => setActiveTab('shows')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'shows' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Calendar className="w-4 h-4" /> Schedule Shows
                  </button>
                  <button
                    onClick={() => setActiveTab('cinema_movies')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'cinema_movies' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Video className="w-4 h-4" /> Movie Catalogue
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Services</div>
                  <button
                    onClick={() => setActiveTab('offers')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'offers' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Award className="w-4 h-4" /> Local Offers
                  </button>
                  <button
                    onClick={() => setActiveTab('canteen')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'canteen' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Coffee className="w-4 h-4" /> Canteen Menu
                  </button>
                  <button
                    onClick={() => setActiveTab('cinema_pricing')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'cinema_pricing' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <TrendingUp className="w-4 h-4" /> Dynamic Pricing
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reports & Gate</div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'bookings' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Video className="w-4 h-4" /> Bookings Report
                  </button>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'validation' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <QrCode className="w-4 h-4" /> QR Check-in
                  </button>
                  <button
                    onClick={() => setActiveTab('scan_logs')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'scan_logs' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <History className="w-4 h-4" /> Scan Logs
                  </button>
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'alerts' ? 'bg-zinc-800/80 text-[#ffcc00]' : 'text-zinc-400 hover:bg-zinc-800/80/50 hover:text-white'}`}
                  >
                    <Bell className="w-4 h-4" /> Customer Alerts
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN CONTENT PANELS */}
        <div className="lg:col-span-3 space-y-6">

          {/* PANEL 1: METRICS (SUPERADMIN ANALYTICS) */}
          {activeTab === 'metrics' && stats && (
            <div className="space-y-6">
              <div className="border-b border-zinc-800 pb-2">
                <h2 className="text-base font-bold text-white">Analytics Dashboard</h2>
                <p className="text-xs text-zinc-400">Real-time indicators of user base, cinema activities, and platform payouts.</p>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#121424] border border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Users</span>
                    <span className="text-xl font-bold text-white">{stats.total_users || 0}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <TrendingUp size={12} className="inline" /> +12.4% this mo.
                    </span>
                  </div>
                  <div className="p-3 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00]">
                    <Users size={20} />
                  </div>
                </div>

                <div className="bg-[#121424] border border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Theatres</span>
                    <span className="text-xl font-bold text-white">{stats.total_cinemas || 0}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <TrendingUp size={12} className="inline" /> +4 registered
                    </span>
                  </div>
                  <div className="p-3 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00]">
                    <Settings size={20} />
                  </div>
                </div>

                <div className="bg-[#121424] border border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Bookings</span>
                    <span className="text-xl font-bold text-white">{stats.total_bookings || 0}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <TrendingUp size={12} className="inline" /> +8.2% vs last wk
                    </span>
                  </div>
                  <div className="p-3 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00]">
                    <Video size={20} />
                  </div>
                </div>

                <div className="bg-[#121424] border border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Revenue</span>
                    <span className="text-xl font-bold text-white">₹{(stats.total_revenue || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                      <AlertTriangle size={12} className="inline" /> -3.1% this mo.
                    </span>
                  </div>
                  <div className="p-3 bg-[#ffcc00]/10 rounded-xl text-[#ffcc00]">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>

              {/* Monthly bookings & Most Watched movies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly bookings */}
                <div className="md:col-span-2 bg-[#121424] border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Monthly Bookings</h3>
                  <div className="h-40 flex items-end justify-between pt-4 px-2">
                    {[
                      { month: 'Nov', count: 180, pct: '35%' },
                      { month: 'Dec', count: 240, pct: '45%' },
                      { month: 'Jan', count: 320, pct: '60%' },
                      { month: 'Feb', count: 290, pct: '55%' },
                      { month: 'Mar', count: 410, pct: '75%' },
                      { month: 'Apr', count: 490, pct: '90%' },
                      { month: 'May', count: 540, pct: '100%' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full">
                        <div className="w-8 bg-zinc-800 hover:bg-zinc-700 rounded-md relative flex items-end h-28">
                          <div 
                            style={{ height: item.pct }} 
                            className={`w-full rounded-md transition-all duration-500 ${idx === 6 ? 'bg-[#ffcc00]' : 'bg-[#ffcc00]/30'}`}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.count}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Watched Movies */}
                <div className="md:col-span-1 bg-[#121424] border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Most Watched Movies</h3>
                  <div className="space-y-4">
                    {/* Kalki [Purple] */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white truncate w-28">Kalki 2898 AD</span>
                        <span className="text-zinc-400 text-[10px]">320 sold</span>
                      </div>
                      <div className="w-full bg-[#07080f]/90 border border-zinc-800/50 h-2 rounded-full overflow-hidden">
                        <div style={{ width: '85%' }} className="bg-[#7b2cbf] h-full rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Stree [Green/Teal] */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white truncate w-28">Stree 2</span>
                        <span className="text-zinc-400 text-[10px]">240 sold</span>
                      </div>
                      <div className="w-full bg-[#07080f]/90 border border-zinc-800/50 h-2 rounded-full overflow-hidden">
                        <div style={{ width: '65%' }} className="bg-[#14b8a6] h-full rounded-full"></div>
                      </div>
                    </div>

                    {/* Dragon [Orange] */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white truncate w-28">Dragon</span>
                        <span className="text-zinc-400 text-[10px]">150 sold</span>
                      </div>
                      <div className="w-full bg-[#07080f]/90 border border-zinc-800/50 h-2 rounded-full overflow-hidden">
                        <div style={{ width: '40%' }} className="bg-[#ea580c] h-full rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="bg-[#121424] border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-semibold text-[10px] uppercase">
                        <th className="pb-3 font-semibold">Activity</th>
                        <th className="pb-3 font-semibold">Module</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {cinemas.filter(c => c.status === 'PENDING').map(c => (
                        <tr key={`pending-cin-${c.id}`} className="hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                          <td className="py-3 font-medium text-white">{c.name} ({c.city_name}) registration request</td>
                          <td className="py-3 text-zinc-400">Theatre Management</td>
                          <td className="py-3 text-right">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Approval</span>
                          </td>
                        </tr>
                      ))}
                      {movies.filter(m => !m.is_approved).map(m => (
                        <tr key={`pending-mov-${m.id}`} className="hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                          <td className="py-3 font-medium text-white">{m.title} movie approval request</td>
                          <td className="py-3 text-zinc-400">Movie Management</td>
                          <td className="py-3 text-right">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Approval</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                        <td className="py-3 font-medium text-white">PVR Inox Calicut registration request</td>
                        <td className="py-3 text-zinc-400">Theatre Management</td>
                        <td className="py-3 text-right">
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Approval</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                        <td className="py-3 font-medium text-white">Singham Returns 2 movie listing approval</td>
                        <td className="py-3 text-zinc-400">Movie Management</td>
                        <td className="py-3 text-right">
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Approval</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                        <td className="py-3 font-medium text-white">User dilmo checked in at IMAX Screen 1</td>
                        <td className="py-3 text-zinc-400">User Management</td>
                        <td className="py-3 text-right">
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 2: THEATRES */}
          {activeTab === 'cinemas' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
                <div className="flex gap-2">
                  {['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setCinemaTabFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${cinemaTabFilter === filter ? 'bg-[#ffcc00] text-white border-[#5c5fc8]' : 'bg-[#121424] border-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddCinema(!showAddCinema)}
                  className="px-4 py-2 rounded-xl bg-[#ffcc00] text-white hover:bg-[#ffcc00]/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={16} /> {showAddCinema ? 'Close Form' : 'Register Theatre'}
                </button>
              </div>

              {showAddCinema && (
                <form onSubmit={handleCreateCinema} className="bg-[#121424] border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Register New Theatre Multiplex</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Theatre Name</label>
                      <input
                        type="text"
                        required
                        value={newCinema.name}
                        onChange={(e) => setNewCinema({ ...newCinema, name: e.target.value })}
                        className="w-full bg-[#121424] border border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none text-white focus:border-[#ffcc00] focus:ring-1 focus:ring-[#ffcc00]"
                        placeholder="E.g. Inox Multiplex"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">City Location</label>
                      <input
                        type="text"
                        required
                        value={newCinema.city_name}
                        onChange={(e) => setNewCinema({ ...newCinema, city_name: e.target.value })}
                        className="w-full bg-[#121424] border border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none text-white focus:border-[#ffcc00] focus:ring-1 focus:ring-[#ffcc00]"
                        placeholder="E.g. Delhi"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Complex Address</label>
                    <textarea
                      required
                      rows="2"
                      value={newCinema.address}
                      onChange={(e) => setNewCinema({ ...newCinema, address: e.target.value })}
                      className="w-full bg-[#121424] border border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none text-white resize-none focus:border-[#ffcc00] focus:ring-1 focus:ring-[#ffcc00]"
                      placeholder="Theatre location details..."
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#ffcc00] text-white rounded-xl hover:bg-[#ffcc00]/90 text-xs font-semibold">
                    Register Multiplex
                  </button>
                </form>
              )}

              {/* Theatre Registry */}
              <div className="bg-[#121424] border border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Theatre Registry Accounts</h3>
                <div className="space-y-3">
                  {(() => {
                    const filtered = cinemas.filter(c => {
                      if (cinemaTabFilter === 'ALL') return true;
                      return c.status === cinemaTabFilter;
                    });
                    if (filtered.length === 0) {
                      return <p className="text-gray-500 text-xs py-4 text-center">No cinemas matching search filter.</p>;
                    }
                    return filtered.map(c => (
                      <div key={c.id} className="p-4 border border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{c.name}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${c.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : c.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1">{c.address} ({c.city_name})</p>
                          <div className="flex gap-4 text-[10px] text-zinc-500 mt-2">
                            <span>Owner: <strong className="text-white">{c.owner_name || 'System Generated'}</strong></span>
                            <span>Commission Rate: <strong className="text-[#ffcc00]">{c.commission_rate}%</strong></span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                          {c.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveCinema(c.id, 'APPROVE')}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveCinema(c.id, 'REJECT')}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {c.status === 'APPROVED' && (
                            <button
                              onClick={() => handleApproveCinema(c.id, 'SUSPEND')}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                          {c.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleApproveCinema(c.id, 'APPROVE')}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingCinema(c); setShowEditCinemaModal(true); }}
                            className="bg-[#121424] border border-zinc-800 hover:bg-[#0b0c15] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCinema(c.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 3: USER MODERATION */}
          {activeTab === 'users' && (
            <div className="bg-[#121424] border border-zinc-800 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                Registered Customers ({usersList.length})
              </h3>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {usersList.length === 0 ? (
                  <p className="text-gray-500 text-xs py-4 text-center">No regular user accounts registered.</p>
                ) : (
                  usersList.map(u => (
                    <div key={u.id} className="p-4 border border-zinc-800 rounded-xl flex justify-between items-center hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl transition">
                      <div>
                        <h4 className="text-xs font-bold text-white">{u.username}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{u.email}</p>
                        <p className="text-[9px] text-[#ffcc00] font-semibold mt-1">REWARD POINTS: {u.reward_points || 0} PTS</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchUserBookingHistory(u.id)}
                          className="bg-[#ffcc00]/10 hover:bg-[#ffcc00]/20 text-[#ffcc00] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer border border-[#ffcc00]/20"
                        >
                          Booking Logs
                        </button>
                        {u.is_active ? (
                          <button
                            onClick={() => handleUserBlock(u.id, true)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserBlock(u.id, false)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Unblock
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PANEL 4: MOVIES */}
          {/* PANEL 4: MOVIES (Super Admin) */}
          {activeTab === 'movies_admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-cyan" style={{ color: t.heading }}>Movie Catalog & Moderation</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Approve new movie entries, toggle featured status, and manage global directory lists.</p>
                </div>
              </div>

              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full max-w-xs">
                    <input 
                      type="text" 
                      placeholder="Search movies…" 
                      value={movieSearch || ''}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {['All', 'Approved', 'Pending'].map(o => (
                      <button
                        key={o}
                        onClick={() => setMovieFilter(o)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border hover:opacity-85 font-cyber"
                        style={{
                          background: (movieFilter || 'All') === o ? t.accent : t.cardBg,
                          color: (movieFilter || 'All') === o ? '#ffffff' : t.inactiveText,
                          borderColor: (movieFilter || 'All') === o ? t.accent : t.cardBorder
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: t.cardBorder, color: t.mutedText }}>
                        <th className="pb-3">Movie</th>
                        <th className="pb-3">Language</th>
                        <th className="pb-3">Release Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Featured</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-medium" style={{ divideColor: t.cardBorder, color: t.heading }}>
                      {movies
                        .filter(m => {
                          const q = (movieSearch || '').toLowerCase();
                          const matchSearch = !q || m.title?.toLowerCase().includes(q) || m.language?.toLowerCase().includes(q);
                          const matchFilter = !movieFilter || movieFilter === 'All'
                            ? true
                            : movieFilter === 'Approved' ? m.is_approved : !m.is_approved;
                          return matchSearch && matchFilter;
                        })
                        .map(m => (
                          <tr key={m.id} className="hover:bg-white/5 transition duration-150">
                            <td className="py-3 font-bold" style={{ color: t.heading }}>{m.title}</td>
                            <td className="py-3" style={{ color: t.heading }}>{m.language}</td>
                            <td className="py-3" style={{ color: t.mutedText }}>{m.release_date}</td>
                            <td className="py-3">
                              <StatusPill status={m.is_approved ? 'Approved' : 'Pending'} t={t} />
                            </td>
                            <td className="py-3">
                              {m.is_featured ? (
                                <StatusPill status="Featured" t={t} />
                              ) : (
                                <span style={{ color: t.mutedText }}>—</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                {!m.is_approved && (
                                  <>
                                    <ActionBtn label="Approve" variant="primary" onClick={() => handleApproveMovie(m.id, 'APPROVE')} t={t} />
                                    <ActionBtn label="Reject" variant="danger" onClick={() => handleApproveMovie(m.id, 'DELETE')} t={t} />
                                  </>
                                )}
                                {m.is_approved && (
                                  <>
                                    <ActionBtn
                                      label={m.is_featured ? 'Unfeature' : 'Feature'}
                                      variant="primary"
                                      onClick={() => handleApproveMovie(m.id, m.is_featured ? 'UNFEATURE' : 'FEATURE')}
                                      t={t}
                                    />
                                    <ActionBtn label="Remove" variant="danger" onClick={() => handleApproveMovie(m.id, 'DELETE')} t={t} />
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 5: REVENUE */}
          {/* PANEL 5: REVENUE */}
          {activeTab === 'revenue' && stats && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-cyan" style={{ color: t.heading }}>Revenue Ledger & Settlements</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Audit total commission splits, default payout metrics, and individual theatre performances.</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Gross Revenue"
                  value={stats.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` : '₹4.2Cr'}
                  delta="2.3% vs last month" up={false} t={t}
                />
                <KpiCard
                  label="Platform Payouts"
                  value={stats.total_revenue ? `₹${(stats.total_revenue * (1 - sysParams.default_commission/100)).toLocaleString('en-IN', {maximumFractionDigits:0})}` : '₹3.78Cr'}
                  delta="to theatres" up t={t}
                />
                <KpiCard
                  label="Net Commission"
                  value={stats.total_revenue ? `₹${(stats.total_revenue * sysParams.default_commission/100).toLocaleString('en-IN', {maximumFractionDigits:0})}` : '₹42L'}
                  delta="3.1% vs last month" up t={t}
                />
              </div>

              {/* Commission Settings Table */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel" 
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: t.cardBorder }}>
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Commission Settings</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: t.cardBorder, color: t.mutedText }}>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Rate (%)</th>
                        <th className="pb-3">Last Updated</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-medium" style={{ divideColor: t.cardBorder, color: t.heading }}>
                      {commissionRates.map(r => (
                        <tr key={r.id} className="hover:bg-white/5 transition duration-150">
                          <td className="py-3.5" style={{ color: t.heading }}>{r.label}</td>
                          <td className="py-3.5">
                            {r.editing ? (
                              <input
                                type="number"
                                value={commissionEditVal[r.id] ?? r.rate}
                                onChange={e => setCommissionEditVal(p => ({ ...p, [r.id]: e.target.value }))}
                                className="w-16 text-xs py-1 px-2 border rounded-lg outline-none focus:ring-1"
                                style={{ 
                                  borderColor: t.accent, 
                                  background: t.workspaceBg, 
                                  color: t.heading,
                                  fontFamily: "inherit"
                                }}
                              />
                            ) : (
                              <span className="font-bold text-glow-cyan" style={{ color: t.accent }}>{r.rate}%</span>
                            )}
                          </td>
                          <td className="py-3.5" style={{ color: t.mutedText }}>Jan 2026</td>
                          <td className="py-3.5 text-right">
                            {r.editing ? (
                              <ActionBtn
                                label={commissionSaved === r.id ? '✓ Saved' : 'Save'}
                                variant="primary"
                                onClick={() => {
                                  const newRate = parseFloat(commissionEditVal[r.id]);
                                  if (isNaN(newRate)) return;
                                  setCommissionRates(prev => prev.map(cr => cr.id === r.id ? { ...cr, rate: newRate, editing: false } : cr));
                                  setCommissionSaved(r.id);
                                  setSysParams(p => ({ ...p, default_commission: newRate }));
                                  setTimeout(() => setCommissionSaved(null), 1800);
                                }}
                                t={t}
                              />
                            ) : (
                              <ActionBtn
                                label="Edit"
                                onClick={() => {
                                  setCommissionRates(prev => prev.map(cr => ({ ...cr, editing: cr.id === r.id })));
                                  setCommissionEditVal(p => ({ ...p, [r.id]: r.rate }));
                                }}
                                t={t}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top theatres by revenue */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel" 
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Top Theatres by Revenue</h3>
                <div className="space-y-4 pt-2">
                  {(stats.theatre_performance && stats.theatre_performance.length > 0
                    ? stats.theatre_performance.slice(0, 5)
                    : [
                        { name: 'Cinepolis TVM', city: 'Trivandrum', sales: 4820000, pct: 88 },
                        { name: 'Carnival Kochi', city: 'Kochi', sales: 4190000, pct: 76 },
                        { name: 'PVR Inox Calicut', city: 'Calicut', sales: 2840000, pct: 52 },
                      ]
                  ).map((perf, idx) => {
                    const maxSales = stats.theatre_performance ? Math.max(...stats.theatre_performance.map(p => p.sales), 1) : 4820000;
                    const pct = perf.pct || Math.round((perf.sales / maxSales) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-4 py-2 border-b" style={{ borderColor: t.cardBorder }}>
                        <div className="flex-1">
                          <div className="text-xs font-bold" style={{ color: t.heading }}>{perf.name}</div>
                          <div className="text-[10px]" style={{ color: t.mutedText }}>{perf.city || ''}</div>
                          <div className="h-1.5 w-full rounded-full overflow-hidden mt-1.5" style={{ background: t.workspaceBg }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${t.accent}, #7b2cbf)` }} />
                          </div>
                        </div>
                        <div className="text-xs font-bold" style={{ color: t.heading }}>
                          ₹{perf.sales ? Number(perf.sales).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 6: REWARDS & COUPONS */}
          {/* PANEL 6: REWARDS & COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-cyan" style={{ color: t.heading }}>Rewards & Global Coupons</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Configure platform-wide discount offers and loyalty rewards referral points.</p>
                </div>
              </div>

              {showAICouponModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                  <div 
                    className="border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleIn"
                    style={{ background: '#06070d', borderColor: t.cardBorder }}
                  >
                    <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: t.cardBorder }}>
                      <div>
                        <h4 className="text-xs font-cyber font-bold uppercase tracking-wider text-glow-cyan" style={{ color: t.heading }}>AI Coupon Assistant</h4>
                        <span className="text-[9px]" style={{ color: t.mutedText }}>Describe the target offer, and AI will draft the coupon fields.</span>
                      </div>
                      <button 
                        onClick={() => setShowAICouponModal(false)} 
                        className="text-gray-400 hover:text-white cursor-pointer font-bold text-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <textarea
                      value={aiCouponPrompt}
                      onChange={e => setAiCouponPrompt(e.target.value)}
                      rows={3}
                      placeholder="e.g. Create an Onam festival offer for Kerala theatres with ₹75 off…"
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1 resize-none"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!aiCouponPrompt.trim()) return;
                        setAiCouponDrafting(true);
                        setTimeout(() => {
                          setAiCouponDraft(generateCouponFromPrompt(aiCouponPrompt));
                          setAiCouponDrafting(false);
                        }, 1100);
                      }}
                      disabled={aiCouponDrafting || !aiCouponPrompt.trim()}
                      className="w-full py-2 text-white text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                      style={{ background: t.accent, boxShadow: t.glow }}
                    >
                      {aiCouponDrafting ? 'Drafting…' : 'Draft coupon'}
                    </button>
                    {aiCouponDraft && (
                      <div className="rounded-xl p-4 border space-y-3" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                        <div className="text-[10px] font-bold text-glow-cyan flex items-center gap-1.5" style={{ color: t.accent }}>
                          <span>✦</span> Claude's draft — review & edit below
                        </div>
                        {[
                          { label: 'Offer name', key: 'name' },
                          { label: 'Coupon code', key: 'code' },
                          { label: 'Discount', key: 'discount' },
                          { label: 'Max discount', key: 'maxDiscount' },
                          { label: 'Scope', key: 'scope' },
                          { label: 'Expiry', key: 'expiry' },
                        ].map(({ label, key }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[9px] font-bold uppercase" style={{ color: t.mutedText }}>{label}</label>
                            <input
                              value={aiCouponDraft[key] || ''}
                              onChange={e => setAiCouponDraft(p => ({ ...p, [key]: e.target.value }))}
                              className="w-full text-[11px] py-1.5 px-2.5 border rounded-lg outline-none focus:ring-1"
                              style={{ 
                                borderColor: t.cardBorder, 
                                background: t.cardBg, 
                                color: t.heading,
                                fontFamily: "inherit"
                              }}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            handleCreateCouponDirect(aiCouponDraft);
                            setShowAICouponModal(false);
                            setAiCouponDraft(null);
                            setAiCouponPrompt('');
                          }}
                          className="w-full py-2 text-white text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber mt-2"
                          style={{ background: t.accent }}
                        >
                          ✓ Create this coupon
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: t.mutedText }}>{couponsList.filter(c => c.is_active !== false).length} active offers configured</span>
                <button
                  onClick={() => setShowAICouponModal(true)}
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer hover:opacity-90 font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  ✦ Create Coupon (AI)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {couponsList.map(c => (
                  <div 
                    key={c.id} 
                    className="rounded-2xl p-5 border shadow-sm glass-panel flex flex-col justify-between animate-fadeIn"
                    style={{ 
                      background: t.cardBg, 
                      borderColor: t.cardBorder, 
                      borderLeft: `3px solid ${c.is_active !== false ? t.accent : t.mutedText}` 
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold" style={{ color: t.heading }}>{c.name}</span>
                        <StatusPill status={c.is_active !== false ? 'Active' : 'Inactive'} t={t} />
                      </div>
                      <div className="font-mono text-xs font-bold text-glow-cyan mb-2" style={{ color: t.accent }}>{c.code}</div>
                      <div className="text-[11px] space-y-0.5" style={{ color: t.mutedText }}>
                        <div>Discount amount: <span className="font-bold text-white">₹{c.discount_amount}</span></div>
                        <div>Expires: <span className="font-medium text-white">{c.expiry_date || 'No expiry'}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: t.cardBorder }}>
                      <ActionBtn
                        label={c.is_active !== false ? 'Deactivate' : 'Reactivate'}
                        variant={c.is_active !== false ? 'danger' : 'primary'}
                        onClick={() => handleToggleCouponActive(c.id, !(c.is_active !== false))}
                        t={t}
                      />
                      <ActionBtn label="Delete" variant="danger" onClick={() => handleDeleteCoupon(c.id)} t={t} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Referral rewards settings panel */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel" 
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Referral Rewards Program</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {[
                    { label: 'Referred friend purchase bonus', val: '50 PTS' },
                    { label: 'Loyalty point cashback ratio', val: '10% back' },
                    { label: 'Rewards point value', val: '1 PT = ₹1.00' },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-4 rounded-xl border flex flex-col justify-between text-left" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                      <span className="text-[10px] uppercase font-bold" style={{ color: t.mutedText }}>{label}</span>
                      <strong className="text-lg font-black text-glow-cyan mt-2 block" style={{ color: t.accent }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 7: BROADCASTS */}
          {/* PANEL 7: BROADCASTS */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-cyan" style={{ color: t.heading }}>Global Broadcast Center</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Dispatch platform-wide alerts and high-priority maintenance warnings to all live sessions.</p>
                </div>
              </div>

              <form 
                onSubmit={handleSendBroadcast} 
                className="rounded-2xl p-6 shadow-sm border space-y-5 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Platform-Wide Broadcast</h3>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Notification Title</label>
                  <input
                    type="text"
                    required
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="E.g. System Maintenance Update"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Alert Message</label>
                  <textarea
                    required
                    rows="4"
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1 resize-none"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="Type broadcast alert content..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Send Global Broadcast
                </button>
              </form>
            </div>
          )}

          {/* PANEL 8: SYSTEM CONFIG */}
          {/* PANEL 8: SYSTEM CONFIG */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-cyan" style={{ color: t.heading }}>System Configurations</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Manage backend mailers, global convenience fees, and audit live logs.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>SMTP Configuration</h3>
                  <div className="flex justify-between items-center p-4 rounded-xl border text-xs" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                    <div>
                      <span className="block font-bold" style={{ color: t.heading }}>SMTP Mail Server</span>
                      <small className="text-[10px]" style={{ color: t.mutedText }}>Dispatch tickets via SMTP server mailer.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={sysParams.smtp_enabled}
                      onChange={(e) => setSysParams({ ...sysParams, smtp_enabled: e.target.checked })}
                      className="w-4 h-4 accent-[#00f2fe]"
                    />
                  </div>
                  <button
                    onClick={() => showMsg('SMTP mail dispatcher synchronizing... Test email sent to admin!')}
                    className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer border hover:bg-white/5 transition"
                    style={{ background: t.workspaceBg, borderColor: t.cardBorder, color: t.mutedText }}
                  >
                    Send SMTP Test Mail
                  </button>
                </div>

                <div 
                  className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Global Convenience Fees</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Default Convenience Fee (INR)</label>
                    <input
                      type="number"
                      value={sysParams.convenience_fee}
                      onChange={(e) => setSysParams({ ...sysParams, convenience_fee: parseFloat(e.target.value) || 30.0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => showMsg('Global convenience fees configured!')}
                    className="px-4 py-2 text-white text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                    style={{ background: t.accent }}
                  >
                    Save Config
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>System Audit Log</h3>
                  <button 
                    onClick={() => showMsg('Logs refreshed!')} 
                    className="hover:opacity-85 text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer font-cyber"
                    style={{ color: t.accent }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
                  </button>
                </div>
                <div 
                  className="rounded-xl p-4 text-[10px] font-mono space-y-1 max-h-36 overflow-y-auto border"
                  style={{ background: t.workspaceBg, borderColor: t.cardBorder, color: t.mutedText }}
                >
                  <p><span style={{ color: t.accent }}>[08-06-2026 19:35:10]</span> INFO: Stripe checkout processed successfully.</p>
                  <p><span style={{ color: t.accent }}>[08-06-2026 19:37:02]</span> INFO: Expired Seat lock checks applied (0 released).</p>
                  <p><span style={{ color: t.accent }}>[08-06-2026 21:05:44]</span> INFO: Extended superadmin dashboard logs fetched successfully.</p>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 9: MULTIPLEX STATS (CINEMA ADMIN MODE) */}
          {/* PANEL 9: MULTIPLEX STATS (CINEMA ADMIN MODE) */}
          {activeTab === 'cinema_metrics' && stats && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Cinema Analytics</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Real-time indicators of sales, showtimes, and theatre fill rates.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="p-5 rounded-2xl border flex items-center justify-between glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <div>
                    <span className="text-[10px] uppercase block font-bold" style={{ color: t.mutedText }}>Active Bookings</span>
                    <span className="text-2xl font-bold mt-1 block" style={{ color: t.heading }}>{stats.total_bookings}</span>
                  </div>
                  <div className="p-3 rounded-xl text-glow-yellow" style={{ background: t.activeBg, color: t.accent }}>
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                </div>
                <div 
                  className="p-5 rounded-2xl border flex items-center justify-between glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <div>
                    <span className="text-[10px] uppercase block font-bold" style={{ color: t.mutedText }}>Cinema Revenue</span>
                    <span className="text-2xl font-bold mt-1 block" style={{ color: t.heading }}>₹{stats.total_revenue}</span>
                  </div>
                  <div className="p-3 rounded-xl text-glow-yellow" style={{ background: t.activeBg, color: t.accent }}>
                    <IndianRupee className="w-6 h-6" />
                  </div>
                </div>
                <div 
                  className="p-5 rounded-2xl border flex items-center justify-between glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <div>
                    <span className="text-[10px] uppercase block font-bold" style={{ color: t.mutedText }}>Avg Occupancy</span>
                    <span className="text-2xl font-bold mt-1 block" style={{ color: t.heading }}>76.5%</span>
                  </div>
                  <div className="p-3 rounded-xl text-glow-yellow" style={{ background: t.activeBg, color: t.accent }}>
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Occupancy Trend & Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="md:col-span-2 rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-cyber font-bold uppercase tracking-wider text-glow-yellow" style={{ color: t.heading }}>7-Day Occupancy Trend</h3>
                      <p className="text-[10px]" style={{ color: t.mutedText }}>Average daily theater fill rate percentage.</p>
                    </div>
                    <div 
                      className="px-2.5 py-1 border rounded-lg text-[10px] font-bold font-cyber"
                      style={{ background: t.accentLight, borderColor: t.cardBorder, color: t.accent }}
                    >
                      Avg: 76.5%
                    </div>
                  </div>
                  {/* Line Chart */}
                  <div className="h-48 w-full pt-4 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                      
                      {/* Line Path */}
                      <path 
                        d="M 20 120 L 110 90 L 200 100 L 290 60 L 380 40 L 470 50 L 560 30" 
                        fill="none" 
                        stroke={t.accent} 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Gradient fill area under the line */}
                      <path 
                        d="M 20 120 L 110 90 L 200 100 L 290 60 L 380 40 L 470 50 L 560 30 L 560 150 L 20 150 Z" 
                        fill="url(#trend-gradient)" 
                        opacity="0.15"
                      />

                      {/* Dots on points */}
                      {[
                        {x: 20, y: 120, val: "55%"},
                        {x: 110, y: 90, val: "68%"},
                        {x: 200, y: 100, val: "62%"},
                        {x: 290, y: 60, val: "80%"},
                        {x: 380, y: 40, val: "92%"},
                        {x: 470, y: 50, val: "88%"},
                        {x: 560, y: 30, val: "95%"}
                      ].map((dot, idx) => (
                        <g key={idx} className="group/dot cursor-pointer">
                          <circle cx={dot.x} cy={dot.y} r="5" fill={t.accent} stroke={t.workspaceBg} strokeWidth="2" />
                          <circle cx={dot.x} cy={dot.y} r="8" fill="transparent" className="hover:fill-[#ffcc00]/20 transition-all duration-200" />
                          <text x={dot.x} y={dot.y - 12} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-zinc-900 duration-150">
                            {dot.val}
                          </text>
                        </g>
                      ))}
                      
                      {/* Gradient Defs */}
                      <defs>
                        <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={t.accent} />
                          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  {/* Labels */}
                  <div className="flex justify-between text-[9px] font-bold uppercase px-1 font-cyber" style={{ color: t.mutedText }}>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                    <span>Mon (Today)</span>
                  </div>
                </div>

                {/* Progress Gauges */}
                <div 
                  className="md:col-span-1 rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Auditorium Allocations</h3>
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: t.heading }}>
                        <span>Audi 1 (IMAX 3D)</span>
                        <span style={{ color: t.accent }}>85% Seated</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden border" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                        <div style={{ width: '85%', background: t.accent }} className="h-full rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: t.heading }}>
                        <span>Audi 2 (Dolby Cinema)</span>
                        <span className="text-teal-400">68% Seated</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden border" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                        <div style={{ width: '68%' }} className="bg-teal-500 h-full rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between" style={{ color: t.heading }}>
                        <span>Audi 3 (Classic VIP)</span>
                        <span className="text-purple-400">42% Seated</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden border" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                        <div style={{ width: '42%' }} className="bg-purple-500 h-full rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL: THEATRE PROFILE */}
          {/* PANEL: THEATRE PROFILE */}
          {activeTab === 'cinema_profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Profile Management</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Configure your multiplex localization properties, contact details, and feature amenities.</p>
                </div>
              </div>

              <form 
                onSubmit={handleUpdateTheatreProfile} 
                className="rounded-2xl p-6 shadow-sm border space-y-5 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="border-b pb-3" style={{ borderColor: t.cardBorder }}>
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Edit Multiplex Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Multiplex Name</label>
                    <input
                      type="text"
                      required
                      value={theatreProfile.name}
                      onChange={(e) => setTheatreProfile({ ...theatreProfile, name: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Location City</label>
                    <input
                      type="text"
                      required
                      value={theatreProfile.city}
                      onChange={(e) => setTheatreProfile({ ...theatreProfile, city: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Complex Physical Address</label>
                  <textarea
                    required
                    rows="2"
                    value={theatreProfile.address}
                    onChange={(e) => setTheatreProfile({ ...theatreProfile, address: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1 resize-none"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Contact Email</label>
                    <input
                      type="email"
                      required
                      value={theatreProfile.email}
                      onChange={(e) => setTheatreProfile({ ...theatreProfile, email: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={theatreProfile.phone}
                      onChange={(e) => setTheatreProfile({ ...theatreProfile, phone: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase block" style={{ color: t.mutedText }}>Amenity & Facility Toggles</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['IMAX Cinema 3D', 'Dolby Atmos Audio', 'Premium Recliner Seats', 'Wheelchair Accessible Rooms', 'Valet Parking Lot', 'Gourmet Food Canteen'].map((facility) => {
                      const isChecked = theatreProfile.facilities.includes(facility);
                      return (
                        <label 
                          key={facility} 
                          className="flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer select-none transition"
                          style={{
                            background: isChecked ? 'rgba(255, 204, 0, 0.08)' : t.workspaceBg,
                            borderColor: isChecked ? t.accent : t.cardBorder,
                            color: isChecked ? t.accent : t.mutedText
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? theatreProfile.facilities.filter(f => f !== facility)
                                : [...theatreProfile.facilities, facility];
                              setTheatreProfile({ ...theatreProfile, facilities: updated });
                            }}
                            className="w-4 h-4 accent-[#ffcc00]"
                          />
                          <span>{facility}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 text-black text-xs font-bold rounded-xl transition duration-200 cursor-pointer font-cyber"
                    style={{ background: t.accent, boxShadow: t.glow }}
                  >
                    Save Profile Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PANEL: MOVIE CATALOGUE */}
          {/* PANEL: MOVIE CATALOGUE */}
          {activeTab === 'cinema_movies' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Request Film Approval</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Request permission from the platform Super Admin to add new movies to your multiplex timeline.</p>
                </div>
              </div>

              {/* Request Form */}
              <form 
                onSubmit={handleSubmitMovieRequest} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="border-b pb-2" style={{ borderColor: t.cardBorder }}>
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Submit Movie Registration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Movie Title</label>
                    <input
                      type="text"
                      required
                      value={newMovie.title}
                      onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. Oppenheimer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Genres</label>
                    <input
                      type="text"
                      required
                      value={newMovie.genre}
                      onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. Biography, Drama, History"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Language</label>
                    <input
                      type="text"
                      required
                      value={newMovie.language}
                      onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="English"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={newMovie.duration}
                      onChange={(e) => setNewMovie({ ...newMovie, duration: parseInt(e.target.value) || 120 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Release Date</label>
                    <input
                      type="date"
                      required
                      value={newMovie.release_date}
                      onChange={(e) => setNewMovie({ ...newMovie, release_date: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Poster Image URL</label>
                  <input
                    type="url"
                    value={newMovie.poster_url}
                    onChange={(e) => setNewMovie({ ...newMovie, poster_url: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Synopsis Summary</label>
                  <textarea
                    required
                    rows="2"
                    value={newMovie.description}
                    onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1 resize-none"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="Describe the movie plot details..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Submit Movie Request
                </button>
              </form>

              {/* Active Movie list */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Multiplex Active Film Catalogue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movies.filter(m => m.is_approved).map(m => (
                    <div 
                      key={m.id} 
                      className="p-3.5 border rounded-xl flex gap-3.5 text-xs transition duration-200 hover:bg-white/5"
                      style={{ background: t.workspaceBg, borderColor: t.cardBorder }}
                    >
                      <img src={m.poster_url || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80"} className="w-16 h-24 object-cover rounded-lg border" style={{ borderColor: t.cardBorder }} alt={m.title} />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-sm block" style={{ color: t.heading }}>{m.title}</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                          </div>
                          <span className="text-[10px] uppercase block mt-1" style={{ color: t.mutedText }}>{m.language} &bull; {m.genre}</span>
                          <span className="text-[10px] block mt-0.5" style={{ color: t.mutedText }}>Duration: {m.duration_minutes || m.duration} Mins</span>
                        </div>
                        <span className="text-[9px]" style={{ color: t.mutedText }}>Released: {m.release_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANEL: DYNAMIC PRICING */}
          {/* PANEL: DYNAMIC PRICING */}
          {activeTab === 'cinema_pricing' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Dynamic Ticket Pricing Console</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Configure real-time automated seat multipliers based on hours of day, weekend peaks, or seat fills.</p>
                </div>
              </div>

              <form 
                onSubmit={handleCreatePricingRule} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="border-b pb-2" style={{ borderColor: t.cardBorder }}>
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Create Dynamic Pricing Rule</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Rule Name</label>
                    <input
                      type="text"
                      required
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. Sunday Peak Hour Surge"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Trigger Category</label>
                    <select
                      value={newRule.type}
                      onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    >
                      <option value="time">Showtime Trigger (Early morning / Late night)</option>
                      <option value="weekend">Calendar Trigger (Weekend markups)</option>
                      <option value="occupancy">Surge Trigger (Occupancy percentages)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Rule Condition Description</label>
                    <input
                      type="text"
                      required
                      value={newRule.condition}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. Shows starting before 11:30 AM or Occupancy > 75%"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Price Multiplier (Ratio)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newRule.multiplier}
                      onChange={(e) => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) || 1.0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. 0.85 (for 15% discount) or 1.25 (for 25% surge)"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Activate Pricing Rule
                </button>
              </form>

              {/* Rules List */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Active Multiplex Pricing Rules</h3>
                <div className="space-y-3">
                  {pricingRules.map(r => (
                    <div 
                      key={r.id} 
                      className="p-4 border rounded-xl flex justify-between items-center hover:bg-white/5 transition duration-150"
                      style={{ background: t.workspaceBg, borderColor: t.cardBorder }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold" style={{ color: t.heading }}>{r.name}</h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase border ${r.type === 'time' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : r.type === 'weekend' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {r.type} rule
                          </span>
                        </div>
                        <p className="text-[10px]" style={{ color: t.mutedText }}>Condition: {r.condition}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-bold block" style={{ color: t.heading }}>{r.multiplier >= 1.0 ? `+${Math.round((r.multiplier - 1.0) * 100)}% Surge` : `-${Math.round((1.0 - r.multiplier) * 100)}% Discount`}</span>
                          <span className="text-[9px] font-semibold block mt-0.5 text-glow-yellow" style={{ color: t.accent }}>Factor: {r.multiplier}x</span>
                        </div>
                        <button
                          onClick={() => handleDeletePricingRule(r.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 10: SCREENS LAYOUT */}
          {/* PANEL 10: SCREENS LAYOUT */}
          {activeTab === 'screens' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Screen Console</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Establish and audit physical seat layout configurations for individual screening rooms.</p>
                </div>
              </div>

              <form 
                onSubmit={handleCreateScreen} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Create Multiplex Screen Layout</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Select Cinema</label>
                    <select
                      value={newScreen.cinema_id}
                      onChange={(e) => setNewScreen({ ...newScreen, cinema_id: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    >
                      {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Screen Name</label>
                    <input
                      type="text"
                      required
                      value={newScreen.name}
                      onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="Screen 1 (Dolby Cinema)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Row Letters (Comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={newScreen.rows}
                      onChange={(e) => setNewScreen({ ...newScreen, rows: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="A,B,C,D,E"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Seats Per Row (Columns)</label>
                    <input
                      type="number"
                      required
                      value={newScreen.cols}
                      onChange={(e) => setNewScreen({ ...newScreen, cols: parseInt(e.target.value) || 8 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Generate Screen Layout
                </button>
              </form>

              {/* Visual Seat Map */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Screen Layout Preview Map</h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Choose Screen</label>
                  <select
                    value={selectedScreenId}
                    onChange={(e) => { setSelectedScreenId(e.target.value); }}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="">Select Screen Layout...</option>
                    {cinemas.map(c => (
                      <optgroup key={c.id} label={c.name}>
                        {screens.filter(s => s.cinema === c.id || s.cinema_id === c.id).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {selectedScreenId && (
                  <div className="mt-6 border rounded-2xl p-6 relative overflow-hidden" style={{ background: t.workspaceBg, borderColor: t.cardBorder }}>
                    {renderVisualLayout()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 11: SCHEDULE SHOWS */}
          {/* PANEL 11: SCHEDULE SHOWS */}
          {activeTab === 'shows' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Timeline Stream Scheduler</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Schedule upcoming movie screen time broadcasts and tier seat pricing thresholds.</p>
                </div>
              </div>

              <form 
                onSubmit={handleAddShow} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Schedule Showtime Slot</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Select Film Signal</label>
                    <select
                      value={newShow.movie_id}
                      onChange={(e) => setNewShow({ ...newShow, movie_id: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    >
                      {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Select Screen</label>
                    <select
                      value={newShow.screen_id}
                      onChange={(e) => {
                        setNewShow({ ...newShow, screen_id: e.target.value });
                      }}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    >
                      <option value="">Choose Screen...</option>
                      {cinemas.map(c => (
                        <optgroup key={c.id} label={c.name}>
                          {screens.filter(s => s.cinema === c.id || s.cinema_id === c.id).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Broadcast Date</label>
                    <input
                      type="date"
                      required
                      value={newShow.date}
                      onChange={(e) => setNewShow({ ...newShow, date: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Start Showtime</label>
                    <input
                      type="time"
                      required
                      value={newShow.start_time}
                      onChange={(e) => setNewShow({ ...newShow, start_time: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>End Showtime</label>
                    <input
                      type="time"
                      required
                      value={newShow.end_time}
                      onChange={(e) => setNewShow({ ...newShow, end_time: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t" style={{ borderColor: t.cardBorder }}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Classic Seat Price</label>
                    <input
                      type="number"
                      value={newShow.classic_price}
                      onChange={(e) => setNewShow({ ...newShow, classic_price: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Premium Seat Price</label>
                    <input
                      type="number"
                      value={newShow.premium_price}
                      onChange={(e) => setNewShow({ ...newShow, premium_price: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Recliner Seat Price</label>
                    <input
                      type="number"
                      value={newShow.recliner_price}
                      onChange={(e) => setNewShow({ ...newShow, recliner_price: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Schedule Show
                </button>
              </form>
            </div>
          )}

          {/* PANEL 12: OFFERS */}
          {/* PANEL 12: OFFERS */}
          {activeTab === 'offers' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Offers & Discounts</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Configure and publish checkout promotion codes for your theater visitors.</p>
                </div>
              </div>

              <form 
                onSubmit={handleCreateOffer} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Create Cinema Offer</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Select Cinema</label>
                    <select
                      value={newOffer.cinema_id}
                      onChange={(e) => setNewOffer({ ...newOffer, cinema_id: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    >
                      {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Offer Code</label>
                    <input
                      type="text"
                      required
                      value={newOffer.code}
                      onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. SHOWZY20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Discount (%)</label>
                    <input
                      type="number"
                      required
                      value={newOffer.discount_percentage}
                      onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: parseInt(e.target.value) || 15 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Valid From</label>
                    <input
                      type="datetime-local"
                      required
                      value={newOffer.valid_from}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_from: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Valid To</label>
                    <input
                      type="datetime-local"
                      required
                      value={newOffer.valid_to}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_to: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Description</label>
                  <input
                    type="text"
                    required
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="Get instant discounts on checkout codes..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Launch Multiplex Offer
                </button>
              </form>

              <div 
                className="rounded-2xl p-6 shadow-sm border glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider mb-4" style={{ color: t.heading }}>Active Cinema Offers ({offersList.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offersList.map(o => (
                    <div 
                      key={o.id} 
                      className="p-3 border rounded-xl flex justify-between items-center hover:bg-white/5 transition duration-150"
                      style={{ background: t.workspaceBg, borderColor: t.cardBorder }}
                    >
                      <div>
                        <span className="font-bold text-xs tracking-wider text-glow-yellow" style={{ color: t.accent }}>{o.code}</span>
                        <span className="inline-block ml-2 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">{o.discount_percentage}% OFF</span>
                        <p className="text-[10px] mt-1" style={{ color: t.heading }}>{o.description}</p>
                        <p className="text-[9px]" style={{ color: t.mutedText }}>Multiplex: {o.cinema_name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteOffer(o.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer transition"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 13: CANTEEN SNACKS */}
          {/* PANEL 13: CANTEEN SNACKS */}
          {activeTab === 'canteen' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Snack Catalog Inventory</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Edit, view, and assign items and pricing lists to your multiplex canteen stands.</p>
                </div>
              </div>

              <form 
                onSubmit={handleAddFood} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Add Canteen Snack / Beverage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Snack Name</label>
                    <input
                      type="text"
                      required
                      value={newFood.name}
                      onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                      placeholder="E.g. Gourmet Cheese Popcorn"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={newFood.price}
                      onChange={(e) => setNewFood({ ...newFood, price: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                      style={{ 
                        borderColor: t.cardBorder, 
                        background: t.workspaceBg, 
                        color: t.heading,
                        fontFamily: "inherit"
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newFood.image_url}
                    onChange={(e) => setNewFood({ ...newFood, image_url: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Description</label>
                  <input
                    type="text"
                    value={newFood.description}
                    onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="E.g. Premium quality popped corn kernels tossed in sharp cheddar cheese seasoning..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Add Canteen Snack
                </button>
              </form>

              {/* Snacks List */}
              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Multiplex Snack Catalog Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {foodList.length === 0 ? (
                    <p className="text-xs py-4 text-center col-span-3" style={{ color: t.mutedText }}>No snack items in multiplex catalog.</p>
                  ) : (
                    foodList.map(item => (
                      <div 
                        key={item.id} 
                        className="rounded-xl overflow-hidden shadow-lg flex flex-col justify-between border transition duration-200 hover:border-zinc-500"
                        style={{ background: t.workspaceBg, borderColor: t.cardBorder }}
                      >
                        <img 
                          src={item.image_url || "https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?w=500&auto=format&fit=crop&q=60"} 
                          className="h-28 w-full object-cover border-b" 
                          style={{ borderColor: t.cardBorder }}
                          alt={item.name} 
                        />
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-bold text-xs truncate block w-28" style={{ color: t.heading }}>{item.name}</span>
                              <span className="font-bold text-xs text-emerald-400">₹{item.price}</span>
                            </div>
                            <p className="text-[10px] mt-1 line-clamp-2" style={{ color: t.mutedText }}>{item.description || "No description provided."}</p>
                          </div>
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleDeleteFood(item.id)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition flex items-center gap-1"
                            >
                              <Trash className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 14: BOOKINGS REPORT */}
          {/* PANEL 14: BOOKINGS REPORT */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Multiplex Bookings Report</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Audit log of ticket transactions registered at your multiplex locations.</p>
                </div>
              </div>

              <div 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3" style={{ borderColor: t.cardBorder }}>
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>
                    Multiplex Bookings Report ({filteredBookings.length})
                  </h3>
                  <button
                    onClick={triggerCSVExport}
                    className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1.5 transition border border-zinc-800 font-cyber"
                  >
                    <Download className="w-3.5 h-3.5 text-glow-yellow" /> Export Report CSV
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Search user or movie title..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                  />
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: t.cardBorder, color: t.mutedText }}>
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Movie</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Seats</th>
                        <th className="pb-3">Showtime</th>
                        <th className="pb-3">Paid</th>
                        <th className="pb-3 text-center">Checked-in</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-medium" style={{ divideColor: t.cardBorder, color: t.heading }}>
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">No booking records found.</td>
                        </tr>
                      ) : (
                        filteredBookings.map(b => (
                          <tr key={b.id} className="hover:bg-white/5 transition duration-150">
                            <td className="py-3 font-semibold text-glow-yellow" style={{ color: t.accent }}>#{b.id}</td>
                            <td className="py-3 font-bold" style={{ color: t.heading }}>{b.movie_title}</td>
                            <td className="py-3">{b.customer_username}</td>
                            <td className="py-3 font-medium text-purple-400">{b.seats}</td>
                            <td className="py-3 text-[11px]" style={{ color: t.mutedText }}>{b.showtime}</td>
                            <td className="py-3 font-bold" style={{ color: t.heading }}>₹{b.final_amount}</td>
                            <td className="py-3 text-center">
                              {b.is_scanned ? (
                                <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] shadow-[0_0_8px_rgba(16,185,129,0.15)]">Scanned</span>
                              ) : (
                                <span style={{ color: t.mutedText }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 15: QR GATE SCANNING VALIDATOR */}
          {activeTab === 'validation' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Gate Ticket Check-in Scanner</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Use the camera to scan QR codes, or enter a token manually to validate tickets at the gate.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Camera Scanner + Manual input */}
                <div
                  className="rounded-2xl p-6 shadow-sm border space-y-5 glass-panel"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Camera QR Scanner</h3>

                  {/* Camera target box */}
                  <div
                    id="qr-camera-container"
                    className="rounded-xl overflow-hidden relative"
                    style={{
                      background: '#06070d',
                      border: cameraActive ? '2px solid var(--cyber-cyan, #00f2fe)' : '2px dashed rgba(255,255,255,0.1)',
                      minHeight: '240px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: cameraActive ? '0 0 20px rgba(0, 242, 254, 0.15)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {!cameraActive && (
                      <div className="text-center py-8 px-4">
                        <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: t.accent }} />
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.mutedText }}>Camera Off</p>
                        <p className="text-[10px] mt-1" style={{ color: t.mutedText }}>Click "Start Camera" to begin scanning</p>
                      </div>
                    )}
                  </div>

                  {/* Camera controls */}
                  <div className="flex gap-2">
                    {!cameraActive ? (
                      <button
                        type="button"
                        onClick={startCameraScanner}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                        style={{ background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', color: '#00f2fe' }}
                      >
                        <Camera className="w-4 h-4" /> Start Camera
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopCameraScanner}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                      >
                        <StopCircle className="w-4 h-4" /> Stop Camera
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: t.cardBorder }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>or enter manually</span>
                    <div className="flex-1 h-px" style={{ background: t.cardBorder }} />
                  </div>

                  {/* Manual input form */}
                  <form onSubmit={handleValidateTicket} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Booking UUID / QR Token</label>
                      <input
                        type="text"
                        required
                        placeholder='Paste booking UUID or QR token here...'
                        value={validationToken}
                        onChange={(e) => setValidationToken(e.target.value)}
                        className="w-full text-xs py-3 px-4 border rounded-xl outline-none focus:ring-1"
                        style={{ 
                          borderColor: t.cardBorder, 
                          background: t.workspaceBg, 
                          color: t.heading,
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2.5 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                      style={{ background: t.accent, boxShadow: t.glow }}
                    >
                      Verify Ticket
                    </button>
                  </form>
                </div>

                {/* RIGHT: Scan Result / Status */}
                <div className="flex flex-col gap-4">
                  {/* Scan status card */}
                  {validationResult ? (
                    <div className="p-6 border border-emerald-500/25 bg-emerald-500/10 rounded-2xl text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">✓ CHECK-IN GRANTED</h4>
                        <p className="text-white text-sm font-bold mt-2">{validationResult.movie}</p>
                        <p className="text-[11px] text-zinc-400 mt-1">Customer: {validationResult.customer}</p>
                        <p className="text-[11px] font-semibold mt-1" style={{ color: t.accent }}>Seats: {validationResult.seats}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Screen: {validationResult.screen}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">Showtime: {validationResult.showtime}</p>
                        {validationResult.checked_in_at && (
                          <p className="text-[9px] text-emerald-500 mt-2 font-bold">Checked-in at: {new Date(validationResult.checked_in_at).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </div>
                  ) : validationError ? (
                    <div className="p-6 border border-rose-500/25 bg-rose-500/10 rounded-2xl text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-500/40" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">✗ CHECK-IN DENIED</h4>
                        <p className="text-white text-xs font-bold mt-2">{validationError}</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="p-8 border border-dashed rounded-2xl text-center"
                      style={{ background: t.workspaceBg, borderColor: t.cardBorder, color: t.mutedText }}
                    >
                      <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: t.accent }} />
                      <p className="text-[10px] uppercase tracking-wider font-semibold">Awaiting Scan Input...</p>
                      <p className="text-[9px] mt-1 opacity-60">Start camera or enter token above</p>
                    </div>
                  )}

                  {/* Gate instructions card */}
                  <div
                    className="p-4 border rounded-2xl space-y-2"
                    style={{ background: t.workspaceBg, borderColor: t.cardBorder }}
                  >
                    <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.mutedText }}>Gate Scanning Guide</h4>
                    <ul className="text-[10px] space-y-1.5" style={{ color: t.mutedText }}>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">1.</span> Click "Start Camera" to activate device webcam/camera</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">2.</span> Point camera at the customer's QR code on phone or print</li>
                      <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">3.</span> System auto-verifies and shows GREEN (admit) or RED (deny)</li>
                      <li className="flex items-start gap-2"><span className="text-rose-400 font-bold mt-0.5">!</span> Duplicate scans are flagged as ALREADY_USED automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 15B: SCAN LOGS */}
          {activeTab === 'scan_logs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Gate Scan Logs Registry</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Audit trail of all QR ticket scans at your multiplex gates.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchScanLogs}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1.5 transition border"
                    style={{ background: t.workspaceBg, borderColor: t.cardBorder, color: t.mutedText }}
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  <button
                    onClick={exportScanLogsCSV}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1.5 transition border"
                    style={{ background: t.workspaceBg, borderColor: t.cardBorder, color: t.mutedText }}
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: t.mutedText }} />
                    <input
                      type="text"
                      placeholder="Search by booking UUID, movie, or staff..."
                      value={scanLogSearch}
                      onChange={(e) => setScanLogSearch(e.target.value)}
                      className="w-full text-xs py-2 pl-8 pr-3 border rounded-xl outline-none focus:ring-1"
                      style={{ borderColor: t.cardBorder, background: t.workspaceBg, color: t.heading, fontFamily: 'inherit' }}
                    />
                  </div>
                  <select
                    value={scanLogStatusFilter}
                    onChange={(e) => setScanLogStatusFilter(e.target.value)}
                    className="w-full text-xs py-2 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ borderColor: t.cardBorder, background: t.workspaceBg, color: t.heading, fontFamily: 'inherit' }}
                  >
                    <option value="ALL">All Scan Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="ALREADY_USED">Already Used (Duplicate)</option>
                    <option value="INVALID">Invalid</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                {/* Table */}
                {scanLogsLoading ? (
                  <div className="py-12 text-center" style={{ color: t.mutedText }}>
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    <p className="text-xs">Loading scan logs...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: t.cardBorder, color: t.mutedText }}>
                          <th className="pb-3">Booking UUID</th>
                          <th className="pb-3">Movie</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Scanned By</th>
                          <th className="pb-3">Scan Time</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Device</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ color: t.heading }}>
                        {(() => {
                          const filtered = scanLogs.filter(log => {
                            const searchMatch = 
                              (log.booking_id || '').toLowerCase().includes(scanLogSearch.toLowerCase()) ||
                              (log.scanned_by || '').toLowerCase().includes(scanLogSearch.toLowerCase()) ||
                              (log.movie_title || '').toLowerCase().includes(scanLogSearch.toLowerCase()) ||
                              (log.customer || '').toLowerCase().includes(scanLogSearch.toLowerCase());
                            const statusMatch = scanLogStatusFilter === 'ALL' || log.status === scanLogStatusFilter;
                            return searchMatch && statusMatch;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan="7" className="py-10 text-center" style={{ color: t.mutedText }}>
                                  <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                  <p className="text-xs">No scan log records found.</p>
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((log, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition duration-150">
                              <td className="py-3 font-mono text-[10px]" style={{ color: t.accent }}>{(log.booking_id || '').substring(0, 12)}...</td>
                              <td className="py-3 font-bold" style={{ color: t.heading }}>{log.movie_title || '—'}</td>
                              <td className="py-3" style={{ color: t.heading }}>{log.customer || '—'}</td>
                              <td className="py-3" style={{ color: t.mutedText }}>{log.scanned_by || 'System'}</td>
                              <td className="py-3 text-[10px]" style={{ color: t.mutedText }}>
                                {log.scan_time ? new Date(log.scan_time).toLocaleString() : '—'}
                              </td>
                              <td className="py-3">
                                {log.status === 'SUCCESS' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ SUCCESS</span>
                                ) : log.status === 'ALREADY_USED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">⚠ DUPLICATE</span>
                                ) : log.status === 'EXPIRED' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">⊘ EXPIRED</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">✗ INVALID</span>
                                )}
                              </td>
                              <td className="py-3 text-[10px]" style={{ color: t.mutedText }}>{log.device || '—'}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 16: CUSTOMER SHOW ALERTS */}
          {/* PANEL 16: CUSTOMER SHOW ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-2 flex justify-between items-center" style={{ borderColor: t.cardBorder }}>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-cyber text-glow-yellow" style={{ color: t.heading }}>Show Alerts Broadcaster</h2>
                  <p className="text-[10px] font-medium" style={{ color: t.mutedText }}>Sends showtime update warnings (delays, screen changes) directly to customer holders.</p>
                </div>
              </div>

              <form 
                onSubmit={handleSendAlert} 
                className="rounded-2xl p-6 shadow-sm border space-y-4 glass-panel"
                style={{ background: t.cardBg, borderColor: t.cardBorder }}
              >
                <h3 className="text-xs font-cyber font-bold uppercase tracking-wider" style={{ color: t.heading }}>Send Showtime Update Alert</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Select Scheduled Show</label>
                  <select
                    required
                    value={alertShowId}
                    onChange={(e) => setAlertShowId(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 border rounded-xl outline-none focus:ring-1"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                  >
                    <option value="">Choose Show...</option>
                    <option value="1">Dune: Part Two - Screen 1 - 10:00 AM</option>
                    <option value="2">Interstellar - Screen 2 - 13:00 PM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase" style={{ color: t.mutedText }}>Alert Message</label>
                  <textarea
                    required
                    rows="4"
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 border rounded-xl outline-none focus:ring-1 resize-none"
                    style={{ 
                      borderColor: t.cardBorder, 
                      background: t.workspaceBg, 
                      color: t.heading,
                      fontFamily: "inherit"
                    }}
                    placeholder="Type show update warning notifications..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="px-4 py-2 text-black text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer font-cyber"
                  style={{ background: t.accent, boxShadow: t.glow }}
                >
                  Broadcast Show Alert
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* UPGRADED ADMIN MODALS */}
      {showEditCinemaModal && editingCinema && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <form onSubmit={handleEditCinemaSubmit} className="bg-[#121424] border border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Edit Theatre Details</h4>
              <button type="button" onClick={() => { setShowEditCinemaModal(false); setEditingCinema(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Theatre Name</label>
              <input
                type="text"
                required
                value={editingCinema.name}
                onChange={(e) => setEditingCinema({ ...editingCinema, name: e.target.value })}
                className="w-full bg-[#121424] border border-zinc-800 focus:border-[#ffcc00] rounded-xl py-2 px-3 text-xs outline-none text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Theatre Address</label>
              <textarea
                required
                rows="2"
                value={editingCinema.address}
                onChange={(e) => setEditingCinema({ ...editingCinema, address: e.target.value })}
                className="w-full bg-[#121424] border border-zinc-800 focus:border-[#ffcc00] rounded-xl py-2 px-3 text-xs outline-none text-white resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingCinema.commission_rate}
                  onChange={(e) => setEditingCinema({ ...editingCinema, commission_rate: e.target.value })}
                  className="w-full bg-[#121424] border border-zinc-800 focus:border-[#ffcc00] rounded-xl py-2 px-3 text-xs outline-none text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Owner Username</label>
                <input
                  type="text"
                  required
                  value={editingCinema.owner_username || 'theatreadmin'}
                  onChange={(e) => setEditingCinema({ ...editingCinema, owner_username: e.target.value })}
                  className="w-full bg-[#121424] border border-zinc-800 focus:border-[#ffcc00] rounded-xl py-2 px-3 text-xs outline-none text-white"
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-[#ffcc00] text-white hover:bg-[#ffcc00]/90 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Save Theatre Settings
            </button>
          </form>
        </div>
      )}

      {showUserBookingsModal && selectedUserBookings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#121424] border border-zinc-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Customer Booking Logs</h4>
              <button type="button" onClick={() => { setShowUserBookingsModal(false); setSelectedUserBookings([]); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {selectedUserBookings.length === 0 ? (
                <p className="text-gray-500 text-xs py-4 text-center">No bookings registered for this account.</p>
              ) : (
                selectedUserBookings.map(b => (
                  <div key={b.id} className="p-3 border border-zinc-800 rounded-xl flex justify-between items-center text-xs hover:bg-[#0d0f1e]/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl transition">
                    <div>
                      <span className="font-bold text-white block">{b.movie_title}</span>
                      <span className="text-[10px] text-zinc-400">{b.theatre_name} &bull; {b.screen_name}</span>
                      <span className="text-[10px] text-[#ffcc00] block mt-0.5 font-semibold">Seats: {b.seats}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">₹{b.final_amount}</span>
                      <span className={`text-[9px] font-bold uppercase mt-0.5 block ${b.status === 'CONFIRMED' ? 'text-emerald-600' : 'text-rose-600'}`}>{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
