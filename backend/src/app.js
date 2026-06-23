const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const videoRoutes = require('./routes/video.routes');
const uploadRoutes = require('./routes/upload.routes');


app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/upload',uploadRoutes);



module.exports = app;