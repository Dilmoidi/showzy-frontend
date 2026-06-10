import React from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { adminUser } = useAuth();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2 w-96">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search bookings, movies..." 
              className="bg-transparent border-none outline-none ml-3 text-sm text-gray-200 w-full placeholder-gray-500"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-200">{adminUser?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500">Theatre Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                {adminUser?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
