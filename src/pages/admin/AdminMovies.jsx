import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Film, Plus, X, Calendar, Clock, Globe, BookOpen, Film as FilmIcon, AlertCircle } from 'lucide-react';

export default function AdminMovies() {
  const { API_BASE, adminToken } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const fetchMovies = async (search = '') => {
    setLoading(true);
    try {
      // Fetch all movies (approved or unapproved) using all=true parameter if backend allows it
      const url = new URL(`${API_BASE}/movies/`);
      url.searchParams.append('all', 'true');
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMovies(data);
      }
    } catch (error) {
      console.error("Failed to fetch movies", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchMovies(searchTerm);
    }
  }, [adminToken]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(searchTerm);
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !description || !duration || !language || !genre || !releaseDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/movies/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: parseInt(duration, 10),
          language,
          genre,
          poster_url: posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500', // fallback poster
          release_date: releaseDate,
          is_approved: true, // auto approve since it's added by admin
          is_active: true,
          is_featured: isFeatured
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Movie added successfully!');
        // Reset fields
        setTitle('');
        setDescription('');
        setDuration('');
        setLanguage('');
        setGenre('');
        setPosterUrl('');
        setReleaseDate('');
        setIsFeatured(false);
        setShowAddModal(false);
        // Refresh list
        fetchMovies(searchTerm);
      } else {
        setError(JSON.stringify(data) || 'Failed to add movie.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-300">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Film className="text-purple-400" />
          Manage Movies
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} />
          Add Movie
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
          <span>{success}</span>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleSearch} className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search movies by title, genre, language..."
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

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading movies...</div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No movies found. Add one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-gray-800/30 border border-gray-800 rounded-2xl p-4 flex gap-4 hover:border-purple-500/30 transition-all group">
                <img
                  src={movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'}
                  alt={movie.title}
                  className="w-24 h-36 object-cover rounded-xl shadow-md bg-gray-950"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-400 transition-colors" title={movie.title}>
                      {movie.title}
                    </h3>
                    <p className="text-xs text-purple-400 font-medium mt-1">{movie.genre}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-2">{movie.description}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-850 flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {movie.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {movie.language}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Movie Modal */}
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
              <FilmIcon className="text-purple-400" />
              Add New Movie
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddMovie} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Movie Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Inception"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Genre *</label>
                  <input
                    type="text"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Action, Sci-Fi"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter movie synopsis..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Duration (mins) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="148"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Language *</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. English"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Release Date *</label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Poster URL</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500/50"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Feature this movie on homepage banners
                </label>
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
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
