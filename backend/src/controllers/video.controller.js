const prisma = require('../lib/prisma');

// @desc    Upload a video for a specific project
// @route   POST /api/videos/upload/:projectId
// @access  Private
const uploadVideo = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a video file.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add a video to this project.' });
    }

   
    const video = await prisma.video.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: `/uploads/${req.file.filename}`, 
        projectId: project.id,
      },
    });

    res.status(201).json({
      message: 'Video uploaded successfully!',
      video,
    });
  } catch (error) {
    console.error('Upload Video Error:', error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
};

module.exports = { uploadVideo };