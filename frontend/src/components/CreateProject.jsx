import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle } from 'lucide-react';

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    liveUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const DEV_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyNzg1NWQ1LTNkNWItNGJmOC05NzhjLTc3MTc2NjU3NDI4NiIsImlhdCI6MTc4Mjc5NTQ0MiwiZXhwIjoxNzgzNDAwMjQyfQ.uq0iCpo_rc_JvMUV5VayONKN1QD_jfFYjEzre7rP7ZI"; 

      await axios.post('http://localhost:5000/api/projects', formData, {
        headers: { Authorization: `Bearer ${DEV_TOKEN}` }
      });
      
      navigate('/upload');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Did you paste your JWT token in the code?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <PlusCircle className="text-blue-400" /> New Project
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Project Title *</label>
          <input 
            type="text" required
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Smart Traffic Simulator"
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Description *</label>
          <textarea 
            required rows="3"
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="What does this project do?"
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Tech Stack</label>
          <input 
            type="text" 
            className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Node.js, Redis, React, Docker"
            onChange={(e) => setFormData({...formData, techStack: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">GitHub URL</label>
            <input 
              type="url" 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://github.com/..."
              onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Live URL (Optional)</label>
            <input 
              type="url" 
              className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://..."
              onChange={(e) => setFormData({...formData, liveUrl: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md transition mt-6"
        >
          {loading ? 'Creating...' : 'Create Project & Continue to Upload'}
        </button>
      </form>
    </div>
  );
};

export default CreateProject;