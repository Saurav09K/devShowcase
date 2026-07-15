import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'; // 🚀 Added Navigate
import Dashboard from './components/Dashboard';
import CreateProject from './components/CreateProject';
import ChunkUploader from './components/ChunkUploader';
import ProjectPage from './components/ProjectPage';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, AuthContext } from './context/AuthContext'; 
import Navbar from './components/Navbar';

const Layout = ({ children, title }) => (
  <div className="min-h-screen p-8 flex flex-col items-center">
    <Link to="/" className="text-3xl font-bold mb-2 text-blue-400 hover:text-blue-300 transition">DevShowcase</Link>
    <p className="text-slate-400 mb-8">{title}</p>
    <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
      {children}
    </div>
  </div>
);


const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar/>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Dashboard */}
          <Route 
            path="/" 
            element={
              <div className="min-h-screen p-8">
                <div className="flex justify-center mb-10">
                  <h1 className="text-3xl font-bold text-blue-400">DevShowcase</h1>
                </div>
                <Dashboard />
              </div>
            } 
          />

          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <Layout title="Create a New Project"><CreateProject /></Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <Layout title="Distributed Upload System"><ChunkUploader /></Layout>
              </ProtectedRoute>
            } 
          />

          {/* Public Project View */}
          <Route path="/project/:id" element={<ProjectPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;