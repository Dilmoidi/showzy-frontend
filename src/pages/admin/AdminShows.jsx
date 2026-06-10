import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, MonitorPlay, Plus, X, Calendar, Clock, Film, Building, Layout, Trash2, AlertCircle } from 'lucide-react';

export default function AdminShows() {
  const { API_BASE, adminToken } = useAuth();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Data for scheduling dropdowns
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  
  // Form states
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classicPrice, setClassicPrice] = useState(150);
  const [premiumPrice, setPremiumPrice] = useState(250);
  const [reclinerPrice, setReclinerPrice] = useState(450);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchShows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/theatre-admin/shows/`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShows(data);
      }
    } catch (err) {
      console.error("Failed to fetch shows", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulingData = async () => {
    try {
      // 1. Fetch movies
      const moviesRes = await fetch(`${API_BASE}/movies/?all=true`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        setMovies(moviesData);
      }

      // 2. Fetch cinemas
      const cinemasRes = await fetch(`${API_BASE}/admin/cinemas/`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (cinemasRes.ok) {
        const cinemasData = await cinemasRes.json();
        setCinemas(cinemasData);
      }
    } catch (err) {
      console.error("Failed to fetch scheduling options", err);
    }
  };

  const handleCinemaChange = async (cinemaId) => {
    setSelectedCinema(cinemaId);
    setSelectedScreen('');
    setScreens([]);
    if (!cinemaId) return;

    try {
      const res = await fetch(`${API_BASE}/admin/screens/?cinema=${cinemaId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const screensData = await res.json();
        setScreens(screensData);
      }
    } catch (err) {
      console.error("Failed to fetch screens for cinema", err);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchShows();
      fetchSchedulingData();
    }
  }, [adminToken]);

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMovie || !selectedScreen || !date || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/shows/schedule/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          movie_id: selectedMovie,
          screen_id: selectedScreen,
          date,
          start_time: startTime,
          end_time: endTime,
          classic_price: parseFloat(classicPrice),
          premium_price: parseFloat(premiumPrice),
          recliner_price: parseFloat(reclinerPrice)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Show scheduled successfully!');
        // Reset fields
        setSelectedMovie('');
        setSelectedCinema('');
        setSelectedScreen('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setClassicPrice(150);
        setPremiumPrice(250);
        setReclinerPrice(450);
        setShowAddModal(false);
        // Refresh shows list
        fetchShows();
      } else {
        setError(data.error || JSON.stringify(data) || 'Failed to schedule show.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show? This will also remove any seating maps for it.")) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/theatre-admin/shows/${showId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (res.ok) {
        setSuccess('Show deleted successfully.');
        fetchShows();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete show.');
      }
    } catch (err) {
      setError('Something went wrong.');
      console.error(err);
    }
  };

  const filteredShows = shows.filter(show => 
    show.movie_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.cinema_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.screen_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-gray-300">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MonitorPlay className="text-purple-400" />
          Manage Shows
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} />
          Schedule Show
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
          <span>{success}</span>
        </div>
      )}

      {error && !showAddModal && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Filter by movie name, cinema, or screen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading shows...</div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No shows scheduled yet. Schedule one to start selling tickets!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="py-4 px-4 font-medium">Movie</th>
                  <th className="py-4 px-4 font-medium">Cinema</th>
                  <th className="py-4 px-4 font-medium">Screen</th>
                  <th className="py-4 px-4 font-medium">Date & Time</th>
                  <th className="py-4 px-4 font-medium">Pricing (C / P / R)</th>
                  <th className="py-4 px-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShows.map((show) => (
                  <tr key={show.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">{show.movie_title}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{show.cinema_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-400">{show.screen_name}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{show.date}</span>
                        <span className="text-xs text-gray-500">{show.start_time} - {show.end_time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-purple-400">
                      ₹{parseInt(show.classic_price)} / ₹{parseInt(show.premium_price)} / ₹{parseInt(show.recliner_price)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleDeleteShow(show.id)}
                        className="p-2 bg-red-650/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 rounded-lg text-red-400 hover:text-white transition-all"
                        title="Delete Show"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Show Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
              <MonitorPlay className="text-purple-400" />
              Schedule New Show
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleScheduleShow} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                  <Film size={16} className="text-purple-400" /> Select Movie *
                </label>
                <select
                  required
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">-- Choose Movie --</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.language})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Building size={16} className="text-purple-400" /> Select Cinema *
                  </label>
                  <select
                    required
                    value={selectedCinema}
                    onChange={(e) => handleCinemaChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">-- Choose Cinema --</option>
                    {cinemas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Layout size={16} className="text-purple-400" /> Select Screen *
                  </label>
                  <select
                    required
                    disabled={!selectedCinema}
                    value={selectedScreen}
                    onChange={(e) => setSelectedScreen(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Choose Screen --</option>
                    {screens.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Calendar size={16} className="text-purple-400" /> Show Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Clock size={16} className="text-purple-400" /> Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                    <Clock size={16} className="text-purple-400" /> End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="bg-gray-950/40 p-4 rounded-xl space-y-3 border border-gray-800/80">
                <h3 className="text-sm font-semibold text-white">Seat Category Pricing (INR)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Classic Seat</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={classicPrice}
                      onChange={(e) => setClassicPrice(e.target.value)}
                      className="w-full bg-gray-850 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Premium Seat</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(e.target.value)}
                      className="w-full bg-gray-850 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Recliner Seat</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={reclinerPrice}
                      onChange={(e) => setReclinerPrice(e.target.value)}
                      className="w-full bg-gray-850 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
                >
                  Schedule Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
