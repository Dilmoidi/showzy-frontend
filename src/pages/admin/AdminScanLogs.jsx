import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ClipboardList, Filter } from 'lucide-react';

export default function AdminScanLogs() {
  const { API_BASE, adminToken } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/theatre-admin/scan-logs/`);
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (statusFilter !== 'ALL') url.searchParams.append('status', statusFilter);
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch scan logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchLogs();
    }
  }, [adminToken, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'ALREADY_USED': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'EXPIRED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'INVALID': return 'bg-red-600/10 text-red-500 border-red-600/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="text-blue-400" />
          Access Scan Logs
        </h1>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleSearch} className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search ID, Customer, Movie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="relative min-w-[150px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="ALREADY_USED">Already Used</option>
              <option value="INVALID">Invalid</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <button 
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="py-4 px-4 font-medium">Scan Time</th>
                <th className="py-4 px-4 font-medium">Booking ID</th>
                <th className="py-4 px-4 font-medium">Movie</th>
                <th className="py-4 px-4 font-medium">Status</th>
                <th className="py-4 px-4 font-medium">Remarks</th>
                <th className="py-4 px-4 font-medium">Scanner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">No scan logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-4 text-sm text-gray-400 whitespace-nowrap">{log.scan_time}</td>
                    <td className="py-4 px-4 text-xs font-mono text-gray-300">{log.booking_id.substring(0, 8)}...</td>
                    <td className="py-4 px-4 text-sm text-gray-300">{log.movie_title}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(log.status)}`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-400">{log.remarks || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{log.scanner}</td>
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
