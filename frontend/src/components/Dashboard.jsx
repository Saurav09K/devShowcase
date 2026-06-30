import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlayCircle, Video, Plus } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/projects');
        setProjects(res.data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="text-center text-slate-400 mt-20">Loading projects...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Project Portfolio</h2>
          <p className="text-slate-400">Manage and view your engineering showcases.</p>
        </div>
        
        <Link to="/create" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium">
          <Plus size={18} /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center bg-slate-800 p-12 rounded-xl border border-slate-700">
          <p className="text-slate-400 mb-4">You haven't created any projects yet.</p>
          <Link to="/create" className="text-blue-400 hover:underline">Create your first project</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition group flex flex-col">
              
              {/* Thumbnail Area */}
              <div className="h-48 bg-slate-900 relative flex items-center justify-center border-b border-slate-700 overflow-hidden">
                {project.video?.thumbnailPath ? (
                  <img 
                    src={`http://localhost:5000${project.video.thumbnailPath}`} 
                    alt="thumbnail" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                ) : (
                  <Video size={40} className="text-slate-700" />
                )}
                
                {/* Play Button Overlay */}
                {project.video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={48} className="text-white drop-shadow-lg" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-white mb-2 truncate">{project.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                  {project.description}
                </p>
                
                {project.video ? (
                  <Link to={`/project/${project.id}`} className="w-full block text-center bg-slate-700 hover:bg-slate-600 py-2 rounded-md transition font-medium text-sm">
                    Watch Demo
                  </Link>
                ) : (
                  <Link to="/upload" className="w-full block text-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/50 py-2 rounded-md transition font-medium text-sm">
                    Needs Demo Video
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;