import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CreateProject from './components/CreateProject';
import ChunkUploader from './components/ChunkUploader';
import ProjectPage from './components/ProjectPage';

const Layout = ({ children, title }) => (
  <div className="min-h-screen p-8 flex flex-col items-center">
    <Link to="/" className="text-3xl font-bold mb-2 text-blue-400 hover:text-blue-300 transition">DevShowcase</Link>
    <p className="text-slate-400 mb-8">{title}</p>
    <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
      {children}
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
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
          element={<Layout title="Create a New Project"><CreateProject /></Layout>} 
        />

        <Route 
          path="/upload" 
          element={<Layout title="Distributed Upload System"><ChunkUploader /></Layout>} 
        />

        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </Router>
  );
}

export default App;