const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');
const generateThumbnail = require("../lib/generateThumbnail")
const { videoQueue } = require('../lib/queue');

// @desc    Upload a video for a specific project
// @route   POST /api/videos/upload/:projectId
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

    await videoQueue.add("generate-thumbnail",{
        videoId: video.id,
        filePath: req.file.path,
      },
    );

    res.status(201).json({
      message: 'Video uploaded successfully!',
      video,
    });
  } catch (error) {
    console.error('Upload Video Error:', error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
};

// @desc    Stream video using HTTP Range Requests
// @route   GET /api/videos/stream/:videoId
const streamVideo = async (req,res)=>{

  try{

    const {videoId} = req.params;

    const video = await prisma.video.findUnique({
      where : {
        id: videoId
      }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(process.cwd(), video.filePath);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file missing from server' });
    }

    const range = req.headers.range;
    console.log('Range Header:', range);
    const videoSize = video.fileSize;

    if (!range) {
      return res.status(400).send('Requires Range header');
    }

    const parts = range.replace("bytes=", "").split("-");
    const chunkSize = 10 ** 6; // 1MB

    const start = Number(parts[0]);
    const end = Math.min(start + chunkSize - 1, videoSize - 1);

    const contentLength = end - start + 1;
    
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": video.mimeType,
    };

    res.writeHead(206, headers);

    const videoStream = fs.createReadStream(videoPath, {
      start,
      end,
    });

    videoStream.pipe(res);
  }catch(error){
    console.error('Streaming Error:', error);
    res.status(500).json({ error: 'Internal server error during streaming' });
  }

};

module.exports = { uploadVideo, streamVideo };