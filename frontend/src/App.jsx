import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChunkUploader from './components/ChunkUploader';
import ProjectPage from './components/ProjectPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="min-h-screen p-8 flex flex-col items-center">
              <h1 className="text-3xl font-bold mb-2 text-blue-400">DevShowcase</h1>
              <p className="text-slate-400 mb-8">Developer Upload Dashboard</p>
              <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
                <ChunkUploader />
              </div>
            </div>
          } 
        />
        <Route path="/project/:id" element={<ProjectPage />} />
      </Routes>
    </Router>
  );
}

export default App;