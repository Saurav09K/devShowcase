import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, UploadCloud, CheckCircle } from 'lucide-react';

const CHUNK_SIZE = 5 * 1024 * 1024; 

const ChunkUploader = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, paused, complete, error
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState(null);
  
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState([]);
  
  const abortControllerRef = useRef(null);
  const isPausedRef = useRef(false);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/projects');
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProjectId(res.data[0].id); // Auto-select the first project
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };
    fetchProjects();
  }, []);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTotalChunks(Math.ceil(selectedFile.size / CHUNK_SIZE));
      setUploadedChunks([]);
      setProgress(0);
      setStatus('idle');
      setUploadId(null);
    }
  };

  const startUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    isPausedRef.current = false;
    abortControllerRef.current = new AbortController();

    try {
      let currentUploadId = uploadId;
      let currentUploadedChunks = [...uploadedChunks];

      // Initialize Session if we don't have one yet
      if (!currentUploadId) {
        const initRes = await axios.post('http://localhost:5000/api/upload/init', {
          fileName: file.name,
          fileSize: file.size
        });
        currentUploadId = initRes.data.uploadId;
        setUploadId(currentUploadId);
      } else {
        // If we already have an ID, ask the server what it has
        const statusRes = await axios.get(`http://localhost:5000/api/upload/status/${currentUploadId}`);
        currentUploadedChunks = statusRes.data.uploadedChunks;
        setUploadedChunks(currentUploadedChunks);
      }

      //Chunking Loop
      for (let index = 0; index < totalChunks; index++) {
        // break the loop if the user clicked Pause
        if (isPausedRef.current) break;

        // Skip chunks the server already has
        if (currentUploadedChunks.includes(index)) {
          continue;
        }

        // SLICE THE FILE
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', currentUploadId);
        formData.append('chunkIndex', index);
        formData.append('chunk', chunkBlob);
        formData.append('projectId', selectedProjectId);
        formData.append('totalChunks', totalChunks);
        

        await axios.post('http://localhost:5000/api/upload/chunk', formData, {
          signal: abortControllerRef.current.signal, // Allows us to cancel the HTTP request mid-flight
        });

        currentUploadedChunks.push(index);
        setUploadedChunks([...currentUploadedChunks]);
        
        const percentComplete = Math.round((currentUploadedChunks.length / totalChunks) * 100);
        setProgress(percentComplete);
      }

      //  Complete & Merge 
      if (!isPausedRef.current && currentUploadedChunks.length === totalChunks) {
        setStatus('merging');

          console.log("Selected Project ID:", selectedProjectId);

        
        await axios.post('http://localhost:5000/api/upload/complete', {
          uploadId: currentUploadId,
          originalName: file.name,
          mimeType: file.type,
          projectId: selectedProjectId,
          totalChunks: totalChunks
        });

        setStatus('complete');
        setProgress(100);
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Upload paused explicitly.');
      } else {
        console.error(error);
        setStatus('error');
      }
    }
  };

  const pauseUpload = () => {
    isPausedRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel the active network request instantly
    }
    setStatus('paused');
  };

  // --- UI RENDERING ---
  return (
    <div className="w-full text-slate-200">

      {/* NEW: Project Selector UI */}
      <div className="mb-4 w-full">
        <label className="block text-sm text-slate-400 mb-2 font-semibold">
          1. Select a Project to attach this demo to:
        </label>
        <select
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-200 focus:outline-none focus:border-blue-500 transition"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          {projects.length === 0 ? (
            <option value="">Loading projects or no projects found...</option>
          ) : (
            projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} 
              </option>
            ))
          )}
        </select>
      </div>  
      
      {/* File Picker */}
      <div className="mb-6 flex flex-col items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-3 text-blue-400" />
            <p className="mb-2 text-sm text-slate-300"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-slate-500">MP4, MKV, MOV up to 1GB</p>
          </div>
          <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
        </label>
      </div>

      {file && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium truncate max-w-[200px]">{file.name}</span>
            <span className="text-sm text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>

          {/* Main Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Controls & Status Text */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-3">
              {(status === 'idle' || status === 'paused' || status === 'error') && (
                <button onClick={startUpload} className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md text-sm transition">
                  <Play size={16} /> <span>{status === 'paused' ? 'Resume' : 'Upload'}</span>
                </button>
              )}
              {status === 'uploading' && (
                <button onClick={pauseUpload} className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-md text-sm transition">
                  <Pause size={16} /> <span>Pause</span>
                </button>
              )}
            </div>

            <div className="text-sm font-mono">
              {status === 'uploading' && <span className="text-blue-400 animate-pulse">⚙️ Dispatching chunks... {progress}%</span>}
              {status === 'paused' && <span className="text-amber-400">⏸️ Paused at {progress}%</span>}
              {status === 'merging' && <span className="text-purple-400 animate-pulse">🔄 Merging chunks on server...</span>}
              {status === 'complete' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={16} /> Complete!</span>}
              {status === 'error' && <span className="text-rose-400">❌ Network Error</span>}
            </div>
          </div>

          {/* THE X-RAY GRID */}
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Chunk Architecture X-Ray ({uploadedChunks.length} / {totalChunks})</p>
            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-md border border-slate-800">
              {Array.from({ length: totalChunks }).map((_, i) => {
                const isUploaded = uploadedChunks.includes(i);
                return (
                  <div 
                    key={i} 
                    title={`Chunk ${i}`}
                    className={`w-4 h-4 rounded-sm transition-colors duration-200 ${
                      isUploaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                    }`}
                  ></div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChunkUploader;