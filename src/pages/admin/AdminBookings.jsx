import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Ticket } from 'lucide-react';

export default function AdminBookings() {
  const { API_BASE, adminToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async (search = '') => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/theatre-admin/bookings/`);
      if (search) url.searchParams.append('search', search);
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchBookings(searchTerm);
    }
  }, [adminToken]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings(searchTerm);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Ticket className="text-purple-400" />
          Recent Bookings
        </h1>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleSearch} className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Booking ID, Customer, or Movie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="py-4 px-4 font-medium">Booking ID</th>
                <th className="py-4 px-4 font-medium">Customer</th>
                <th className="py-4 px-4 font-medium">Movie</th>
                <th className="py-4 px-4 font-medium">Showtime</th>
                <th className="py-4 px-4 font-medium">Seats</th>
                <th className="py-4 px-4 font-medium">Status</th>
                <th className="py-4 px-4 font-medium">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">Loading bookings...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 text-xs font-mono text-gray-300">{b.booking_id.substring(0, 8)}...</td>
                    <td className="py-4 px-4 text-sm font-medium text-white">{b.customer_username}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{b.movie_title}</td>
                    <td className="py-4 px-4 text-sm text-gray-400">{b.showtime}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{b.seats || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        b.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        b.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {b.is_checked_in ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Checked In
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Pending</span>
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
  );
}
