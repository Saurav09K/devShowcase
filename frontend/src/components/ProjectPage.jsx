import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaGithub } from "react-icons/fa";
import { Code , ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';

const ProjectPage = () => {
  const { id } = useParams(); 
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/projects/${id}`);
        setProject(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Project not found or server error.');
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-400">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-400 text-xl font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto p-6 md:p-12 text-slate-200">
      
      {/* Navigation */}
      <Link to="/" className="inline-flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition mb-8">
        <ArrowLeft size={20} />
        <span>Back to Upload Dashboard</span>
      </Link>

      {/* Header Section */}
      <div className="mb-8 border-b border-slate-700 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          {project.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
          <span className="bg-blue-900/50 text-blue-300 border border-blue-700/50 px-3 py-1 rounded-full font-medium">
            Built by {project.user?.username || 'Developer'}
          </span>
          
          {/* Tech Stack Tags (Splitting the comma-separated string we saved earlier) */}
          {project.techStack && project.techStack.split(',').map((tech, i) => (
            <span key={i} className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full">
              {tech.trim()}
            </span>
          ))}
        </div>

        {/* Action Links */}
        <div className="flex space-x-4">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition">
              <FaGithub size={28} /><span>View Code</span>
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition text-white">
              <ExternalLink size={18} /> <span>Live Demo</span>
            </a>
          )}
        </div>
      </div>

      {/* The Magic: Video Player */}
      <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 mb-10 aspect-video relative">
        {project.video ? (
          <video 
            controls 
            className="w-full h-full object-contain"
            // THIS is where our backend HTTP Range Requests shine:
            src={`http://localhost:5000/api/videos/stream/${project.video.id}`}
            poster={project.video.thumbnailPath ? `http://localhost:5000${project.video.thumbnailPath}` : undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-500">
            <Loader2 className="animate-spin w-8 h-8 mb-4 opacity-50" />
            <p>Video processing or not uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="prose prose-invert max-w-none">
        <h2 className="text-2xl font-semibold text-white mb-4">About this project</h2>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {project.description}
        </p>
      </div>

    </div>
  );
};

export default ProjectPage;