import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Film, 
  MonitorPlay, 
  Ticket, 
  ScanLine, 
  ClipboardList, 
  IndianRupee, 
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const { logoutAdmin, adminUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Movies', path: '/admin/movies', icon: <Film size={20} /> },
    { name: 'Shows', path: '/admin/shows', icon: <MonitorPlay size={20} /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <Ticket size={20} /> },
    { name: 'Scan Ticket', path: '/admin/scan-ticket', icon: <ScanLine size={20} /> },
    { name: 'Scan Logs', path: '/admin/scan-logs', icon: <ClipboardList size={20} /> },
    { name: 'Revenue', path: '/admin/revenue', icon: <IndianRupee size={20} /> },
    { name: 'Profile', path: '/admin/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0 text-gray-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Showzy Admin
        </h2>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{adminUser?.role?.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-purple-600/20 text-purple-400 font-medium border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                  : 'hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
