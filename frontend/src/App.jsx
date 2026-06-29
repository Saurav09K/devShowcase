import React from 'react';
import ChunkUploader from './components/ChunkUploader'

function App() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2 text-blue-400">DevShowcase</h1>
      <p className="text-slate-400 mb-8">Distributed Upload System</p>
      
      <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
        {/* Render it here */}
        <ChunkUploader />
      </div>
    </div>
  );
}

export default App;