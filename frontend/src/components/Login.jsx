import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      login(response.data.token, response.data.user);
      
      navigate('/'); 
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.error || 'Failed to login. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <LogIn className="text-blue-500" size={32} />
            Welcome Back
          </h2>
          <p className="text-slate-400 mt-2">Sign in to your distributed matrix</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="email" required
                className="w-full bg-slate-950 border border-slate-700 rounded-md py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                placeholder="you@example.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="password" required
                className="w-full bg-slate-950 border border-slate-700 rounded-md py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md transition mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;