import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, MapPin, LogIn, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';

export default function Header({ searchVal, setSearchVal }) {
  const { user, logout, cities, selectedCity, updateCity } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const cityObj = cities.find(c => c.id == cityId);
    if (cityObj) {
      updateCity(cityId, cityObj.name);
    }
  };

  const handleSearchChange = (e) => {
    setSearchVal(e.target.value);
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header style={{
      background: '#1A1917',
      borderBottom: '1px solid #C5A880',
      padding: '0 40px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
    }}>
      {/* Left side: Logo & Menu links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={26} style={{ color: '#D4AF37' }} />
          <span style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '24px',
            fontWeight: 800,
            color: '#F5F5F7',
            letterSpacing: '0.5px'
          }}>
            Show<span style={{ color: '#D4AF37' }}>zy</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '450px', marginLeft: '10px' }}>
          <input
            type="text"
            placeholder="Search for Movies, Plays, Sports, Events and Activities"
            value={searchVal || ''}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '6px',
              background: '#0D0D0D',
              border: '1px solid #C5A880',
              color: '#F5F5F7',
              fontSize: '14px',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </div>

      {/* Right side: City Picker, Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        
        {/* City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} style={{ color: '#D4AF37' }} />
          <select
            value={selectedCity || ''}
            onChange={handleCityChange}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F5F5F7',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              paddingRight: '5px'
            }}
          >
            {cities.map(city => (
              <option key={city.id} value={city.id} style={{ background: '#1A1917', color: '#F5F5F7' }}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user ? (
            <>
              {(user.role === 'SUPERADMIN' || user.role === 'THEATRE_ADMIN') && (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D4AF37', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  <Shield size={14} /> Control
                </Link>
              )}
              
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F5F5F7', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                <UserIcon size={14} style={{ color: '#D4AF37' }} />
                <span>{user.username}</span>
              </Link>

              <button 
                onClick={logout} 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid #C5A880', 
                  color: '#F5F5F7', 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500
                }}
              >
                <LogOut size={12} /> Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              style={{ 
                background: '#D4AF37', 
                color: '#0D0D0D', 
                padding: '8px 18px', 
                fontSize: '13px', 
                textDecoration: 'none', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
              }}
            >
              Sign In
            </Link>
          )}
        </div>

      </div>

    </header>
  );
}

const dropdownItemStyle = {
  display: 'block',
  padding: '8px 20px',
  color: '#333333',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'background 0.2s ease'
};
dropdownItemStyle.hover = {
  background: '#fcfbf7'
};
