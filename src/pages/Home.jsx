import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Play, Calendar, Languages, Tv, Smile, Sparkles, 
  ChevronRight, ChevronLeft, Bell, Film, HelpCircle, UtensilsCrossed, Heart, Star
} from 'lucide-react';

export default function Home({ searchVal }) {
  const { selectedCity, selectedCityName, API_BASE, token } = useAuth();
  const navigate = useNavigate();

  // Primary data states
  const [movies, setMovies] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [aiMovies, setAiMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Active filters and tab controls
  const [activeTab, setActiveTab] = useState('Now Showing'); 
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(''); 
  const [withSubtitle, setWithSubtitle] = useState(false);

  // Quick Book state machine
  const [quickBookMode, setQuickBookMode] = useState('Movie'); 
  const [qbMovie, setQbMovie] = useState('');
  const [qbDate, setQbDate] = useState('');
  const [qbCinema, setQbCinema] = useState('');
  const [qbShow, setQbShow] = useState('');

  // Hero carousel controls
  const [heroIndex, setHeroIndex] = useState(0);

  // Floating overlays states
  const [fbOpen, setFbOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notificationBellActive, setNotificationBellActive] = useState({});

  const languages = ['English', 'Hindi', 'Telugu', 'Malayalam', 'Tamil'];
  const genres = ['Action', 'Sci-Fi', 'Adventure', 'Drama', 'Thriller', 'Animation'];
  const formats = ['IMAX', '4DX', 'MX4D', '2D', '3D'];

  // Categories list (matching BMS homepage circles)
  const categoriesList = [
    { name: 'Movies', icon: <Film size={24} className="text-[#D4AF37]" />, active: true },
    { name: 'Stream', icon: <Tv size={24} className="text-[#C5A880]" /> },
    { name: 'Events', icon: <Sparkles size={24} className="text-[#C5A880]" /> },
    { name: 'Plays', icon: <Smile size={24} className="text-[#C5A880]" /> },
    { name: 'Sports', icon: <Calendar size={24} className="text-[#C5A880]" /> },
    { name: 'Food & Drinks', icon: <UtensilsCrossed size={24} className="text-[#C5A880]" /> }
  ];

  // Bank Offers Data
  const offersList = [
    {
      id: 1,
      title: 'Get 25% off* on Tickets',
      provider: 'OneCard Offer',
      desc: 'Get 25% off* on Tickets at cinemas using OneCard credit cards. Max discount INR 200.',
      validity: 'Mon, Aug 31, 2026',
      badge: 'CYBER50',
      bgColor: '#1A1917',
      textColor: '#F5F5F7',
      borderColor: '#C5A880'
    },
    {
      id: 2,
      title: 'Up to Rs 100 back*',
      provider: 'Amazon Pay Balance',
      desc: 'Pay with Amazon Pay Balance & get up to Rs100 back. Minimum order value of Rs 299.',
      validity: 'Mon, Aug 31, 2026',
      badge: 'AMZ100',
      bgColor: '#1A1917',
      textColor: '#F5F5F7',
      borderColor: '#C5A880'
    },
    {
      id: 3,
      title: 'Cashback up to Rs 250',
      provider: 'Airtel Payments Bank',
      desc: 'Cashback up to Rs 250 on transacting with Airtel Payments Bank UPI for min MOV of Rs 300.',
      validity: 'Tue, Jun 30, 2026',
      badge: 'AIRTEL250',
      bgColor: '#1A1917',
      textColor: '#F5F5F7',
      borderColor: '#C5A880'
    },
    {
      id: 4,
      title: 'Buy 1 Get 1* on Tickets',
      provider: 'American Express',
      desc: 'Buy 1 Get 1* Free Movie Tickets on selected American Express Cards.',
      validity: 'Wed, Sep 30, 2026',
      badge: 'BOGOAMEX',
      bgColor: '#1A1917',
      textColor: '#F5F5F7',
      borderColor: '#C5A880'
    }
  ];

  // Fetch movies catalogue and all showtimes in current city
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/movies/?city=${selectedCity}`;
        if (selectedLanguage) url += `&language=${selectedLanguage}`;
        if (selectedGenre) url += `&genre=${selectedGenre}`;
        if (searchVal) url += `&search=${searchVal}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMovies(data);
        }
      } catch (e) {
        console.error("Failed to load movies", e);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCity) {
      fetchMovies();
      fetchCanteenFood();
    }
  }, [selectedCity, selectedLanguage, selectedGenre, searchVal]);

  // Fetch food items for canteen overlay
  const fetchCanteenFood = async () => {
    try {
      const res = await fetch(`${API_BASE}/food/`);
      if (res.ok) {
        const data = await res.json();
        setFoodItemsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch AI Recommendations
  useEffect(() => {
    const fetchAiRecommendations = async () => {
      if (!token) return;
      setAiLoading(true);
      try {
        const response = await fetch(`${API_BASE}/recommendations/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAiMovies(data);
        }
      } catch (e) {
        console.error("Failed to load AI recommendations", e);
      } finally {
        setAiLoading(false);
      }
    };

    if (token) {
      fetchAiRecommendations();
    } else {
      setAiMovies([]);
    }
  }, [token]);

  // Load show dates / cinemas when a movie is selected in Quick Book
  const [qbShowDates, setQbShowDates] = useState([]);
  const [qbCinemas, setQbCinemas] = useState([]);
  const [qbTimings, setQbTimings] = useState([]);

  useEffect(() => {
    if (!qbMovie) {
      setQbDate('');
      setQbCinema('');
      setQbShow('');
      setQbShowDates([]);
      setQbCinemas([]);
      setQbTimings([]);
      return;
    }

    const fetchMovieShows = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrowStr = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
        const nextDayStr = new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0];

        const resToday = await fetch(`${API_BASE}/movies/${qbMovie}/shows/?city=${selectedCity}&date=${todayStr}`);
        const resTomorrow = await fetch(`${API_BASE}/movies/${qbMovie}/shows/?city=${selectedCity}&date=${tomorrowStr}`);
        const resNextDay = await fetch(`${API_BASE}/movies/${qbMovie}/shows/?city=${selectedCity}&date=${nextDayStr}`);

        let allMatchedShows = [];
        if (resToday.ok) {
          const dToday = await resToday.json();
          dToday.forEach(c => allMatchedShows.push(...c.shows));
        }
        if (resTomorrow.ok) {
          const dTom = await resTomorrow.json();
          dTom.forEach(c => allMatchedShows.push(...c.shows));
        }
        if (resNextDay.ok) {
          const dNext = await resNextDay.json();
          dNext.forEach(c => allMatchedShows.push(...c.shows));
        }

        setAllShows(allMatchedShows);

        const dates = [...new Set(allMatchedShows.map(s => s.date))].sort();
        setQbShowDates(dates);

        const cinemasMap = {};
        allMatchedShows.forEach(s => {
          cinemasMap[s.cinema] = s.cinema_name;
        });
        setQbCinemas(Object.keys(cinemasMap).map(id => ({ id, name: cinemasMap[id] })));
      } catch (err) {
        console.error(err);
      }
    };

    fetchMovieShows();
  }, [qbMovie, selectedCity]);

  // Update Timings list when date & cinema are chosen
  useEffect(() => {
    if (!qbMovie || !qbDate || !qbCinema) {
      setQbShow('');
      setQbTimings([]);
      return;
    }
    const matched = allShows.filter(s => s.date === qbDate && String(s.cinema) === String(qbCinema));
    setQbTimings(matched);
  }, [qbDate, qbCinema, qbMovie, allShows]);

  const handleQuickBookSubmit = () => {
    if (!qbShow) {
      alert("Please select Movie, Date, Cinema, and Showtime to reserve seats.");
      return;
    }
    navigate(`/shows/${qbShow}/seats`);
  };

  // Auto cycle hero carousel
  const activeHeroMoviesList = movies.filter(m => m.is_featured).length > 0 
    ? movies.filter(m => m.is_featured) 
    : movies.slice(0, 5);

  useEffect(() => {
    if (activeHeroMoviesList.length === 0) return;
    const cycle = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % activeHeroMoviesList.length);
    }, 6000);
    return () => clearInterval(cycle);
  }, [activeHeroMoviesList]);

  const activeHeroMovie = activeHeroMoviesList.length > 0 ? activeHeroMoviesList[heroIndex] : null;

  const getFilteredMovies = () => {
    const today = new Date();
    return movies.filter(movie => {
      const releaseDate = new Date(movie.release_date);
      if (activeTab === 'Now Showing') {
        return releaseDate <= today;
      } else {
        return releaseDate > today;
      }
    });
  };

  const handleToggleBell = (movieId) => {
    setNotificationBellActive(prev => ({
      ...prev,
      [movieId]: !prev[movieId]
    }));
    alert("Alert signal logged! You will be notified when tickets go live.");
  };

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 1. Autoplay Hero Showcase Slideshow */}
      {activeHeroMovie && !searchVal && (
        <section style={{
          position: 'relative',
          background: '#0D0D0D',
          minHeight: '380px',
          display: 'flex',
          alignItems: 'center',
          color: '#F5F5F7',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
        }}>
          {/* Blurred Background Image */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${activeHeroMovie.poster_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.2) blur(30px)',
            transform: 'scale(1.1)',
            zIndex: 1
          }} />

          {/* Banner Contents */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '30px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            flexWrap: 'wrap'
          }}>
            
            {/* Movie Info Details */}
            <div style={{ flex: 1, minWidth: '320px' }}>
              <span style={{ 
                color: '#D4AF37', 
                fontSize: '12px', 
                letterSpacing: '2px',
                fontWeight: 'bold',
                display: 'block',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}>
                Featured Screening In {selectedCityName}
              </span>
              <h1 style={{ 
                fontSize: '40px', 
                fontWeight: 800, 
                margin: '0 0 15px 0', 
                lineHeight: 1.2,
                color: '#F5F5F7',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)'
              }}>
                {activeHeroMovie.title}
              </h1>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#D4AF37', marginBottom: '20px', fontWeight: 600 }}>
                <span style={{ background: '#D4AF37', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#0D0D0D', fontWeight: 'bold' }}>UA</span>
                <span>&bull;</span>
                <span style={{ color: '#F5F5F7' }}>{activeHeroMovie.duration_minutes} Mins</span>
                <span>&bull;</span>
                <span style={{ color: '#C5A880' }}>{activeHeroMovie.genre}</span>
              </div>
              <p style={{ 
                color: '#F5F5F7', 
                fontSize: '14px', 
                lineHeight: '1.6', 
                marginBottom: '30px', 
                maxWidth: '600px',
                opacity: 0.85
              }}>
                {activeHeroMovie.description}
              </p>
              
              <Link to={`/movies/${activeHeroMovie.id}`} style={{ 
                fontSize: '14px', 
                textDecoration: 'none',
                background: '#D4AF37',
                color: '#0D0D0D',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                transition: 'transform 0.2s'
              }}>
                <Play size={16} fill="#0D0D0D" /> Book Tickets
              </Link>
            </div>

            {/* Poster Frame and Indicator controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ 
                position: 'relative', 
                width: '200px', 
                aspectRatio: '2/3', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)', 
                border: '1px solid #C5A880' 
              }}>
                <img 
                  src={activeHeroMovie.poster_url} 
                  alt={activeHeroMovie.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Autoplay Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeHeroMoviesList.map((m, idx) => (
                  <button 
                    key={m.id}
                    onClick={() => setHeroIndex(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: heroIndex === idx ? '#D4AF37' : '#64748b',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'color 0.2s',
                      outline: 'none'
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 2. Interactive Quick Book Bar */}
      <section style={{ maxWidth: '1240px', margin: '-25px auto 40px auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          background: '#1A1917', 
          border: '1px solid #C5A880', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#F5F5F7' }}>Quick Book:</span>
            <div style={{ display: 'flex', background: '#0D0D0D', borderRadius: '8px', padding: '3px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <button 
                onClick={() => setQuickBookMode('Movie')}
                style={{
                  border: 'none',
                  background: quickBookMode === 'Movie' ? '#D4AF37' : 'transparent',
                  color: quickBookMode === 'Movie' ? '#0D0D0D' : '#C5A880',
                  fontWeight: 'bold',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Movie
              </button>
              <button 
                onClick={() => setQuickBookMode('Cinema')}
                style={{
                  border: 'none',
                  background: quickBookMode === 'Cinema' ? '#D4AF37' : 'transparent',
                  color: quickBookMode === 'Cinema' ? '#0D0D0D' : '#C5A880',
                  fontWeight: 'bold',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cinema
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, gap: '12px', flexWrap: 'wrap', minWidth: '280px' }}>
            {/* Movie Select */}
            <select 
              value={qbMovie} 
              onChange={(e) => setQbMovie(e.target.value)}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #C5A880',
                outline: 'none',
                background: '#0D0D0D',
                fontSize: '13px',
                color: '#F5F5F7'
              }}
            >
              <option value="" style={{background: '#0D0D0D'}}>Choose Movie</option>
              {movies.map(m => (
                <option key={m.id} value={m.id} style={{background: '#0D0D0D'}}>{m.title}</option>
              ))}
            </select>

            {/* Date Select */}
            <select 
              value={qbDate}
              onChange={(e) => setQbDate(e.target.value)}
              disabled={!qbMovie}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #C5A880',
                outline: 'none',
                background: '#0D0D0D',
                fontSize: '13px',
                color: '#F5F5F7',
                opacity: qbMovie ? 1 : 0.6
              }}
            >
              <option value="" style={{background: '#0D0D0D'}}>Choose Date</option>
              {qbShowDates.map(d => (
                <option key={d} value={d} style={{background: '#0D0D0D'}}>{new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</option>
              ))}
            </select>

            {/* Cinema Select */}
            <select 
              value={qbCinema}
              onChange={(e) => setQbCinema(e.target.value)}
              disabled={!qbDate}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #C5A880',
                outline: 'none',
                background: '#0D0D0D',
                fontSize: '13px',
                color: '#F5F5F7',
                opacity: qbDate ? 1 : 0.6
              }}
            >
              <option value="" style={{background: '#0D0D0D'}}>Choose Cinema</option>
              {qbCinemas.map(c => (
                <option key={c.id} value={c.id} style={{background: '#0D0D0D'}}>{c.name}</option>
              ))}
            </select>

            {/* Showtime Select */}
            <select 
              value={qbShow}
              onChange={(e) => setQbShow(e.target.value)}
              disabled={!qbCinema}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #C5A880',
                outline: 'none',
                background: '#0D0D0D',
                fontSize: '13px',
                color: '#F5F5F7',
                opacity: qbCinema ? 1 : 0.6
              }}
            >
              <option value="" style={{background: '#0D0D0D'}}>Choose Timing</option>
              {qbTimings.map(t => (
                <option key={t.id} value={t.id} style={{background: '#0D0D0D'}}>{t.start_time.substring(0, 5)} - {t.screen_name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleQuickBookSubmit}
            style={{
              background: '#D4AF37',
              color: '#0D0D0D',
              border: 'none',
              padding: '11px 28px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
          >
            Find Tickets
          </button>

        </div>
      </section>

      {/* Categories Badge row */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 35px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', flexWrap: 'wrap' }}>
          {categoriesList.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => cat.name === 'Food & Drinks' ? setFbOpen(true) : alert(`Navigating to ${cat.name} portal...`)}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                width: '90px'
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#1A1917',
                border: '1px solid #C5A880',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {cat.icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F7', textAlign: 'center' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid Content */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Recommended Header & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #C5A880', paddingBottom: '15px', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            <button 
              onClick={() => setActiveTab('Now Showing')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'Now Showing' ? '#D4AF37' : '#C5A880',
                fontSize: '20px',
                fontWeight: 800,
                cursor: 'pointer',
                borderBottom: activeTab === 'Now Showing' ? '3px solid #D4AF37' : 'none',
                paddingBottom: '12px',
                marginBottom: '-16px'
              }}
            >
              Recommended Movies
            </button>
            <button 
              onClick={() => setActiveTab('Coming Soon')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'Coming Soon' ? '#D4AF37' : '#C5A880',
                fontSize: '20px',
                fontWeight: 800,
                cursor: 'pointer',
                borderBottom: activeTab === 'Coming Soon' ? '3px solid #D4AF37' : 'none',
                paddingBottom: '12px',
                marginBottom: '-16px'
              }}
            >
              Coming Soon
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {formats.slice(0, 3).map(f => (
              <button
                key={f}
                onClick={() => setSelectedFormat(selectedFormat === f ? '' : f)}
                style={{
                  background: selectedFormat === f ? '#D4AF37' : '#1A1917',
                  border: '1px solid',
                  borderColor: '#C5A880',
                  color: selectedFormat === f ? '#0D0D0D' : '#F5F5F7',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
            
            <div style={{ width: '1px', height: '20px', background: '#C5A880', margin: '0 8px' }} />

            <select 
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #C5A880', fontSize: '13px', background: '#1A1917', color: '#F5F5F7', outline: 'none' }}
            >
              <option value="" style={{background: '#1A1917'}}>All Genres</option>
              {genres.map(g => (
                <option key={g} value={g} style={{background: '#1A1917'}}>{g}</option>
              ))}
            </select>

            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #C5A880', fontSize: '13px', background: '#1A1917', color: '#F5F5F7', outline: 'none' }}
            >
              <option value="" style={{background: '#1A1917'}}>All Languages</option>
              {languages.map(l => (
                <option key={l} value={l} style={{background: '#1A1917'}}>{l}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Movie Cards Catalog Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <span style={{ color: '#C5A880', fontSize: '15px', fontWeight: 600 }}>Loading matches in {selectedCityName}...</span>
          </div>
        ) : getFilteredMovies().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: '#1A1917', border: '1px dashed #C5A880', borderRadius: '12px', color: '#C5A880' }}>
            No movies match your filters in {selectedCityName} yet. Try changing filters or selecting a different city!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '30px',
            marginBottom: '60px'
          }}>
            {getFilteredMovies().map(movie => (
              <div 
                key={movie.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  background: '#1A1917',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(212, 175, 55, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
                }}
              >
                {/* Poster Box */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden' }}>
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Rating Indicator overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    background: '#0D0D0D',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#F5F5F7',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    borderTop: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#D4AF37" className="text-[#D4AF37]" />
                      <span>8.5/10</span>
                    </span>
                    <span style={{ color: '#C5A880', fontSize: '10px' }}>42K Votes</span>
                  </div>

                  {/* Gold Live Release badge */}
                  <span style={{
                    position: 'absolute',
                    top: '12px', left: '12px',
                    background: '#D4AF37',
                    color: '#0D0D0D',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    Live
                  </span>
                </div>

                {/* Card details body */}
                <div style={{ padding: '15px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 700, textTransform: 'uppercase' }}>
                    {movie.genre.split(', ').slice(0, 2).join(' / ')}
                  </span>
                  <strong style={{ fontSize: '16px', color: '#F5F5F7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {movie.title}
                  </strong>
                  <span style={{ fontSize: '13px', color: '#C5A880', opacity: 0.8 }}>
                    {movie.language} &bull; {movie.duration_minutes} Mins
                  </span>

                  {/* Booking controls */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <Link 
                      to={`/movies/${movie.id}`} 
                      style={{ 
                        flex: 1, 
                        fontSize: '12px', 
                        padding: '10px 0', 
                        borderRadius: '6px', 
                        background: '#D4AF37',
                        color: '#0D0D0D',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 2px 5px rgba(212, 175, 55, 0.2)'
                      }}
                    >
                      Book Tickets
                    </Link>
                    <button 
                      onClick={() => handleToggleBell(movie.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '1px solid #C5A880',
                        background: notificationBellActive[movie.id] ? '#252422' : '#0D0D0D',
                        color: '#D4AF37',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Turn on alert notifications"
                    >
                      <Bell size={15} fill={notificationBellActive[movie.id] ? '#D4AF37' : 'none'} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* 4. Stream Showcase Banner */}
        <section style={{ margin: '50px 0', width: '100%' }}>
          <div style={{
            background: 'linear-gradient(90deg, #1A1917 0%, #252422 100%)',
            borderRadius: '16px',
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '30px',
            color: '#F5F5F7',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            border: '1px solid #C5A880'
          }}>
            <div>
              <span style={{ background: '#D4AF37', color: '#0D0D0D', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Stream</span>
              <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '12px 0 10px 0' }}>
                Rent or Buy New Releases Weekly
              </h2>
              <p style={{ color: '#C5A880', margin: 0, fontSize: '14px', maxWidth: '500px' }}>
                Watch movies at home on any screen, from Hollywood blocks to award-winning documentaries.
              </p>
            </div>
            <a 
              href="#categories" 
              onClick={(e) => { e.preventDefault(); alert("BookMyShow Stream catalogues are synced automatically inside the homepage slider below!"); }} 
              style={{
                background: '#D4AF37',
                color: '#0D0D0D',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: '13px',
                boxShadow: '0 4px 10px rgba(212, 175, 55, 0.2)'
              }}
            >
              Browse Stream catalog
            </a>
          </div>
        </section>

        {/* 5. Offers For You Section */}
        <section style={{ margin: '50px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F5F7', margin: 0 }}>Offers For You</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #C5A880', background: '#1A1917', color: '#F5F5F7', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #C5A880', background: '#1A1917', color: '#F5F5F7', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px' }}>
            {offersList.map(offer => (
              <div 
                key={offer.id}
                style={{
                  flex: '0 0 320px',
                  background: offer.bgColor,
                  color: offer.textColor,
                  border: `1px solid ${offer.borderColor}`,
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}
              >
                <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {offer.provider}
                </span>
                <strong style={{ fontSize: '18px', display: 'block', minHeight: '44px' }}>
                  {offer.title}
                </strong>
                <p style={{ fontSize: '12px', color: '#C5A880', margin: 0, lineHeight: 1.5, minHeight: '54px' }}>
                  {offer.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: '15px' }}>
                  <span style={{ fontSize: '11px', color: '#C5A880' }}>
                    Valid till: {offer.validity}
                  </span>
                  <button 
                    onClick={() => alert(`Apply Coupon: ${offer.badge} during booking checkout summary!`)}
                    style={{ background: '#D4AF37', border: 'none', color: '#0D0D0D', fontWeight: 'bold', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    View Card
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </section>

      {/* 6. Floating Action badging for Canteen and Recommendations */}
      <div style={{
        position: 'fixed',
        bottom: '25px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1A1917',
        border: '1px solid #C5A880',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        borderRadius: '30px',
        padding: '6px',
        display: 'flex',
        gap: '4px',
        zIndex: 999
      }}>
        <button 
          onClick={() => setFbOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F5F5F7',
            fontWeight: 'bold',
            padding: '10px 22px',
            borderRadius: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <UtensilsCrossed size={15} style={{ color: '#D4AF37' }} /> Order F&B
        </button>
        <div style={{ width: '1px', background: '#C5A880', alignSelf: 'stretch', margin: '4px 0', opacity: 0.3 }} />
        <button 
          onClick={() => setAiOpen(true)}
          style={{
            background: '#D4AF37',
            border: 'none',
            color: '#0D0D0D',
            fontWeight: 'bold',
            padding: '10px 22px',
            borderRadius: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <Sparkles size={15} fill="#0D0D0D" /> Curated Shows
        </button>
      </div>

      {/* Floating F&B Snack Modal */}
      {fbOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1A1917', border: '1px solid #C5A880', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 35px rgba(0,0,0,0.8)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#F5F5F7', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <UtensilsCrossed size={18} style={{ color: '#D4AF37' }} /> Showzy Canteen Catalogue
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {foodItemsList.map(food => (
                <div key={food.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '10px' }}>
                  <img src={food.image_url} alt={food.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#F5F5F7' }}>{food.name}</strong>
                    <span style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 'bold' }}>INR {parseFloat(food.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setFbOpen(false)} style={{ background: 'transparent', border: '1px solid #C5A880', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#F5F5F7' }}>
                Close
              </button>
              <button onClick={() => { setFbOpen(false); alert("Snack cart cached! Proceed to book ticket to pre-order snacks."); }} style={{ background: '#D4AF37', border: 'none', color: '#0D0D0D', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                Pre-order Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curated AI Recommendations Modal */}
      {aiOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1A1917', border: '1px solid #C5A880', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 35px rgba(0,0,0,0.8)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#F5F5F7', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Sparkles size={18} style={{ color: '#D4AF37' }} /> AI Curated Recommendations
            </h3>
            <p style={{ color: '#C5A880', fontSize: '12px', margin: '0 0 20px 0' }}>
              Recommendations tailored exactly to your recent booking habits!
            </p>

            {token ? (
              aiLoading ? (
                <div style={{color: '#F5F5F7'}}>Retrieving recommendations...</div>
              ) : aiMovies.length === 0 ? (
                <div style={{ color: '#C5A880', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                  No transaction history found on this account. Book a ticket to start your personalized recommendations!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  {aiMovies.map(movie => (
                    <div key={movie.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '12px' }}>
                      <img src={movie.poster_url} alt={movie.title} style={{ width: '50px', height: '70px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', background: '#252422', color: '#D4AF37', border: '1px solid #C5A880', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                          98% MATCH
                        </span>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#F5F5F7', marginTop: '4px' }}>{movie.title}</strong>
                        <span style={{ fontSize: '12px', color: '#C5A880' }}>{movie.language} &bull; {movie.genre}</span>
                      </div>
                      <Link to={`/movies/${movie.id}`} onClick={() => setAiOpen(false)} style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', background: '#D4AF37', color: '#0D0D0D', textDecoration: 'none', fontWeight: 'bold' }}>
                        Book
                      </Link>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: '#C5A880' }}>
                Please log in to load recommendations.
                <div style={{ marginTop: '15px' }}>
                  <Link to="/login" onClick={() => setAiOpen(false)} style={{ fontSize: '12px', textDecoration: 'none', padding: '8px 20px', borderRadius: '6px', background: '#D4AF37', color: '#0D0D0D', fontWeight: 'bold', display: 'inline-block' }}>
                    Login Now
                  </Link>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justify: 'flex-end', marginTop: '15px' }}>
              <button onClick={() => setAiOpen(false)} style={{ background: 'transparent', border: '1px solid #C5A880', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#F5F5F7' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
