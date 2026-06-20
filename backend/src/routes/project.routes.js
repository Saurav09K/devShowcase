const express = require('express');
const { createProject, getProjects, getProjectById } = require('../controllers/project.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Private routes 
router.post('/', protect, createProject);

module.exports = router;