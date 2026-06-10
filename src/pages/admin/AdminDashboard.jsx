import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Film, Ticket, ScanLine, Clock, IndianRupee } from 'lucide-react';

export default function AdminDashboard() {
  const { API_BASE, adminToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/theatre-admin/dashboard/`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (adminToken) {
      fetchDashboardStats();
    }
  }, [API_BASE, adminToken]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-purple-400">Loading Dashboard...</div>;
  }

  const statCards = [
    { title: "Today's Shows", value: stats?.todays_shows || 0, icon: <Film size={24} className="text-blue-400" />, bg: "from-blue-600/20 to-blue-900/20", border: "border-blue-500/30" },
    { title: "Today's Bookings", value: stats?.todays_bookings || 0, icon: <Ticket size={24} className="text-purple-400" />, bg: "from-purple-600/20 to-purple-900/20", border: "border-purple-500/30" },
    { title: "Tickets Scanned", value: stats?.tickets_scanned || 0, icon: <ScanLine size={24} className="text-green-400" />, bg: "from-green-600/20 to-green-900/20", border: "border-green-500/30" },
    { title: "Pending Entries", value: stats?.pending_entries || 0, icon: <Clock size={24} className="text-orange-400" />, bg: "from-orange-600/20 to-orange-900/20", border: "border-orange-500/30" },
    { title: "Revenue Today", value: `₹${stats?.revenue_today?.toLocaleString() || 0}`, icon: <IndianRupee size={24} className="text-pink-400" />, bg: "from-pink-600/20 to-pink-900/20", border: "border-pink-500/30" }
  ];

  const maxBookings = Math.max(...(stats?.hourly_bookings?.map(h => h.bookings) || [0]), 1);
  const maxCheckins = Math.max(...(stats?.hourly_checkins?.map(h => h.checkins) || [0]), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`relative p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border ${stat.border} backdrop-blur-sm overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-xl bg-gray-900/50 backdrop-blur-md">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Bookings Chart */}
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">Hourly Bookings</h2>
          <div className="h-64 flex items-end space-x-2">
            {stats?.hourly_bookings?.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div 
                  className="w-full bg-gradient-to-t from-purple-900/50 to-purple-500 rounded-t-sm group-hover:to-purple-400 transition-colors relative"
                  style={{ height: `${(data.bookings / maxBookings) * 100}%`, minHeight: data.bookings > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {data.bookings} Bookings
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 rotate-45 origin-left">{data.hour}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Check-ins Chart */}
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">Hourly Check-ins</h2>
          <div className="h-64 flex items-end space-x-2">
            {stats?.hourly_checkins?.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div 
                  className="w-full bg-gradient-to-t from-green-900/50 to-green-500 rounded-t-sm group-hover:to-green-400 transition-colors relative"
                  style={{ height: `${(data.checkins / maxCheckins) * 100}%`, minHeight: data.checkins > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {data.checkins} Scans
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 rotate-45 origin-left">{data.hour}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
