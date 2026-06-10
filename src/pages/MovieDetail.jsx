import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar, Globe, Film, ChevronRight } from 'lucide-react';

export default function MovieDetail() {
  const { id } = useParams();
  const { selectedCity, selectedCityName, API_BASE } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Show listing states
  const [showsGrouped, setShowsGrouped] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  
  // Generate date selectors (Today, Tomorrow, Day after)
  const getDatesList = () => {
    const dates = [];
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const formattedDate = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = i === 0 ? 'TODAY' : weekdays[d.getDay()];
      const displayStr = `${d.getDate()} ${months[d.getMonth()]}`;
      
      dates.push({ formattedDate, dayName, displayStr });
    }
    return dates;
  };
  
  const datesList = getDatesList();
  const [selectedDate, setSelectedDate] = useState(datesList[0].formattedDate);

  // 1. Fetch movie details
  useEffect(() => {
    const fetchMovieDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/movies/${id}/`);
        if (response.ok) {
          const data = await response.json();
          setMovie(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetail();
  }, [id]);

  // 2. Fetch shows whenever movie, city, or date changes
  useEffect(() => {
    const fetchShows = async () => {
      if (!selectedCity || !selectedDate) return;
      setShowsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/movies/${id}/shows/?city=${selectedCity}&date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setShowsGrouped(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setShowsLoading(false);
      }
    };
    fetchShows();
  }, [id, selectedCity, selectedDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="font-cyber text-glow-cyan">LOADING FILM DETAILS...</span>
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Film signal offline.</h2>
        <Link to="/" className="cyber-btn cyber-btn-cyan" style={{ marginTop: '20px' }}>Return to Base</Link>
      </div>
    );
  }

  return (
    <main style={{ padding: '0 20px 40px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--cyber-cyan)' }}>{movie.title}</span>
      </div>

      {/* Hero Movie Section */}
      <section className="glass-panel scanline-effect" style={{
        borderRadius: '24px',
        overflow: 'hidden',
        marginBottom: '40px',
        background: 'rgba(13, 15, 30, 0.7)',
        position: 'relative'
      }}>
        {/* Backdrop image */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${movie.poster_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.25) blur(15px)',
          zIndex: 1
        }} />

        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          gap: '40px',
          padding: '40px',
          flexWrap: 'wrap',
          alignItems: 'flex-start'
        }}>
          {/* Poster Frame */}
          <img 
            src={movie.poster_url} 
            alt={movie.title} 
            style={{
              width: '240px',
              borderRadius: '16px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
            }}
          />

          {/* Details Column */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '42px', margin: '0 0 15px 0', color: 'white', fontWeight: 800 }}>
              {movie.title}
            </h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '25px', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-cyan)' }}>
                <Clock size={16} /> {movie.duration_minutes} Minutes
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-magenta)' }}>
                <Globe size={16} /> {movie.language}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Film size={16} /> {movie.genre}
              </span>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>SYNOPSIS</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                {movie.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Release Date: <strong style={{ color: 'white' }}>{new Date(movie.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Date & Showtime Selector */}
      <h2 className="font-cyber" style={{ fontSize: '20px', letterSpacing: '1px', marginBottom: '20px' }}>
        SCHEDULED BROADCASTS
      </h2>

      {/* Date Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        {datesList.map(date => {
          const isActive = selectedDate === date.formattedDate;
          return (
            <button
              key={date.formattedDate}
              onClick={() => setSelectedDate(date.formattedDate)}
              className="glass-panel"
              style={{
                padding: '12px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '12px',
                background: isActive ? 'var(--cyber-cyan)' : 'rgba(13, 15, 30, 0.4)',
                borderColor: isActive ? 'var(--cyber-cyan)' : 'var(--border-glass)',
                color: isActive ? 'var(--bg-primary)' : 'white',
                minWidth: '130px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', opacity: isActive ? 0.8 : 0.6 }}>
                {date.dayName}
              </div>
              <div className="font-cyber" style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
                {date.displayStr}
              </div>
            </button>
          );
        })}
      </div>

      {/* Theatres and Showtimes */}
      <div className="glass-panel" style={{ padding: '30px', background: 'rgba(13, 15, 30, 0.4)' }}>
        {showsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="font-cyber text-glow-cyan">FILTERING THEATRE FREQUENCIES...</span>
          </div>
        ) : showsGrouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <p>No broadcast schedules found in {selectedCityName} for this date.</p>
            <p style={{ fontSize: '13px', marginTop: '5px' }}>Try switching dates above or check again later.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {showsGrouped.map((cinemaGroup) => (
              <div 
                key={cinemaGroup.cinema_id} 
                style={{ 
                  display: 'flex', 
                  gap: '30px', 
                  flexWrap: 'wrap', 
                  paddingBottom: '25px', 
                  borderBottom: '1px solid var(--border-glass)' 
                }}
              >
                {/* Cinema Details */}
                <div style={{ flex: '0 0 280px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'white', fontWeight: 600 }}>
                    {cinemaGroup.cinema_name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {cinemaGroup.address}
                  </p>
                </div>

                {/* Showtimes Grid */}
                <div style={{ flex: 1, display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {cinemaGroup.shows.map((show) => {
                    // Format start time e.g., "10:00" to "10:00 AM"
                    const [hourStr, minStr] = show.start_time.split(':');
                    const hour = parseInt(hourStr);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    const timeFormatted = `${displayHour}:${minStr} ${ampm}`;

                    return (
                      <Link 
                        key={show.id}
                        to={`/shows/${show.id}/seats`}
                        className="cyber-btn cyber-btn-cyan font-cyber"
                        style={{
                          textDecoration: 'none',
                          padding: '10px 18px',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        {timeFormatted}
                        <span style={{ fontSize: '10px', opacity: 0.6, display: 'block', fontWeight: 400, marginTop: '2px' }}>
                          {show.screen_name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
