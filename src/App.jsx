import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import SeatSelection from './pages/SeatSelection';
import GroupSeatSelection from './pages/GroupSeatSelection';
import SelectFood from './pages/SelectFood';
import BookingSummary from './pages/BookingSummary';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TheatreAdminLogin from './pages/TheatreAdminLogin';
import Profile from './pages/Profile';
import { useParams } from 'react-router-dom';

// New Theatre Admin imports
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import NewAdminDashboard from './pages/admin/AdminDashboard';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminBookings from './pages/admin/AdminBookings';
import AdminScanLogs from './pages/admin/AdminScanLogs';
import AdminScanTicket from './pages/admin/AdminScanTicket';
import AdminMovies from './pages/admin/AdminMovies';
import AdminShows from './pages/admin/AdminShows';

const BookingSummaryWrapper = () => {
  const { bookingId } = useParams();
  return <BookingSummary key={bookingId} />;
};

function AppContent({ searchVal, setSearchVal }) {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      
      {/* Conditionally render Global Header */}
      {!isAdminPath && <Header searchVal={searchVal} setSearchVal={setSearchVal} />}
      
      {/* Main Routing Container */}
      <div style={
        isAdminPath 
          ? { flex: 1, width: '100%', boxSizing: 'border-box' }
          : { flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box', padding: '0 20px' }
      }>
        <Routes>
          <Route path="/" element={<Home searchVal={searchVal} />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/shows/:showId/group/:sessionToken" element={<GroupSeatSelection />} />
          <Route path="/shows/:showId/food" element={<SelectFood />} />
          <Route path="/bookings/:bookingId/pay" element={<BookingSummaryWrapper />} />
          <Route path="/bookings/:bookingId/success" element={<Confirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<TheatreAdminLogin />} />
          
          {/* Super Admin Dashboard (Legacy) */}
          <Route path="/admin/legacy" element={<AdminDashboard />} />

          {/* New Modern Theatre Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminLayout><NewAdminDashboard /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/movies" element={<ProtectedAdminRoute><AdminLayout><AdminMovies /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/shows" element={<ProtectedAdminRoute><AdminLayout><AdminShows /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/revenue" element={<ProtectedAdminRoute><AdminLayout><AdminRevenue /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminLayout><AdminBookings /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/scan-logs" element={<ProtectedAdminRoute><AdminLayout><AdminScanLogs /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin/scan-ticket" element={<ProtectedAdminRoute><AdminLayout><AdminScanTicket /></AdminLayout></ProtectedAdminRoute>} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout><NewAdminDashboard /></AdminLayout></ProtectedAdminRoute>} />

          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      {/* Conditionally render Global Footer */}
      {!isAdminPath && <Footer />}

    </div>
  );
}

export default function App() {
  const [searchVal, setSearchVal] = useState('');

  return (
    <AuthProvider>
      <Router>
        <AppContent searchVal={searchVal} setSearchVal={setSearchVal} />
      </Router>
    </AuthProvider>
  );
}

