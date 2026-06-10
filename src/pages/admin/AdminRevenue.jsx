import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IndianRupee, TrendingUp, Calendar, CalendarDays } from 'lucide-react';

export default function AdminRevenue() {
  const { API_BASE, adminToken } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch(`${API_BASE}/theatre-admin/revenue/`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRevenue(data);
        }
      } catch (error) {
        console.error("Failed to fetch revenue", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (adminToken) {
      fetchRevenue();
    }
  }, [API_BASE, adminToken]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-green-400">Loading Revenue Data...</div>;
  }

  const revenueCards = [
    { title: "Today's Revenue", value: revenue?.revenue_today || 0, icon: <IndianRupee size={32} className="text-emerald-400" />, bg: "from-emerald-600/20 to-emerald-900/20", border: "border-emerald-500/30" },
    { title: "This Week", value: revenue?.revenue_week || 0, icon: <Calendar size={32} className="text-teal-400" />, bg: "from-teal-600/20 to-teal-900/20", border: "border-teal-500/30" },
    { title: "This Month", value: revenue?.revenue_month || 0, icon: <CalendarDays size={32} className="text-cyan-400" />, bg: "from-cyan-600/20 to-cyan-900/20", border: "border-cyan-500/30" }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-emerald-400" />
            Revenue Analytics
          </h1>
          <p className="text-gray-400 mt-1">Track your theatre's financial performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {revenueCards.map((card, idx) => (
          <div key={idx} className={`relative p-8 rounded-3xl bg-gradient-to-br ${card.bg} border ${card.border} backdrop-blur-md overflow-hidden group hover:-translate-y-2 transition-all duration-300 shadow-xl`}>
            <div className="absolute -right-8 -top-8 opacity-10 group-hover:opacity-20 transition-opacity scale-150">
              {card.icon}
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 rounded-2xl bg-gray-900/50 backdrop-blur-md shadow-inner">
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-lg text-gray-300 font-medium tracking-wide">{card.title}</p>
              <h3 className="text-5xl font-black text-white mt-2 drop-shadow-md">
                ₹{card.value.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-3xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Financial Summary</h2>
        <p className="text-gray-400 leading-relaxed">
          The revenue calculated above is based entirely on confirmed and completed bookings from your authorized cinemas. Failed or pending transactions, as well as unverified split payments, are excluded to ensure accuracy.
        </p>
      </div>
    </div>
  );
}
