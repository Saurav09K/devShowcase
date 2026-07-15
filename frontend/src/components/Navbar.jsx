import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { token, user, logout } = useContext(AuthContext); // 🚀 Pull state and logout function
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Brand Logo */}
      <Link to="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition">
        DevShowcase
      </Link>

      {/* Dynamic Auth Buttons */}
      <div className="flex items-center gap-4">
        {token ? (
          // USER IS LOGGED IN
          <>
            <span className="text-slate-300 flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-sm">
              <UserIcon size={16} className="text-slate-400" />
              {user?.username || 'Hacker'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-md transition text-sm font-medium border border-red-500/20"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : (
          // USER IS LOGGED OUT
          <>
            <Link to="/login" className="flex items-center gap-2 text-slate-300 hover:text-white transition font-medium text-sm">
              <LogIn size={16} />
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition text-sm font-medium">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;