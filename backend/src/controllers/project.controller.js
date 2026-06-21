const prisma = require('../lib/prisma');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, techStack, githubUrl, liveUrl } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        techStack,
        githubUrl,
        liveUrl,
        userId: req.user.id, //  from the auth middleware
      },
    });

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Get all projects 
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } }, 
        video: true,
      },
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } },
        video: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createProject, getProjects, getProjectById };