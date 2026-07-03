const { v4: uuidv4 } = require("uuid");
const fs = require('fs');
const path = require("path");
const prisma = require("../lib/prisma");
const { videoQueue } = require("../lib/queue");
const storageService = require("../services/storage.service");

// @desc    Initialize a chunked upload session
// @route   POST /api/upload/init
// @access  Private
const initializeUpload = async (req,res)=>{
    const uploadId = uuidv4();

    try{

    console.log(`[UPLOAD SESSION STARTED] ID: ${uploadId}`);

     res.status(200).json({
      message: 'Upload session initialized',
      uploadId: uploadId,
    });
    
    }catch(error){
     console.error('Initialize Upload Error:', error);
     res.status(500).json({ error: 'Failed to initialize upload session.' });

    }

}
// @desc    Upload a single chunk of a video
// @route   POST /api/upload/chunk
// @access  Private
const uploadChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    const chunkFile = req.file;

    if (!uploadId || chunkIndex===undefined || !chunkFile) {
      return res.status(400).json({ error: 'uploadId, chunkIndex, and chunk file are required.' });
    }

    const result = await storageService.saveChunk(
      uploadId,
      parseInt(chunkIndex, 10),
      chunkFile.path
    )

    res.status(200).json({ 
      message: `Chunk ${chunkIndex} stored successfully.`,
      chunkIndex: chunkIndex
    });

  } catch (error) {
    console.error('Chunk Upload Error:', error);
    res.status(500).json({ error: 'Failed to save chunk.' });
  }
}

const completeUpload = async (req, res) => {
 try {
    const { uploadId,originalName, mimeType, projectId, totalChunks } = req.body;

    if (!uploadId || !originalName || !projectId || totalChunks === undefined) {
      return res.status(400).json({ error: 'Missing required fields to complete upload.' });
    }

   const finalDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(finalDir, { recursive: true });

    const finalFilename = `${uploadId}.mp4`;
    const finalVideoPath = path.join(finalDir, finalFilename);

    await storageService.mergeChunks(uploadId, totalChunks, finalVideoPath);

    const finalStats = await fs.promises.stat(finalVideoPath);

    const existingVideo = await prisma.video.findUnique({
      where: { projectId: projectId }
    });

    if (existingVideo) {
      console.log(`Overwrite detected. Cleaning up old files for project: ${projectId}`);
      
      if (existingVideo.filePath) {
        const oldVideoPath = path.join(process.cwd(), 'uploads', existingVideo.fileName);
        try {
          await fs.promises.unlink(oldVideoPath);
          console.log(`Deleted old video: ${existingVideo.fileName}`);
        } catch (err) {
          console.warn(`Could not delete old video (maybe already gone): ${err.message}`);
        }
      }

      if (existingVideo.thumbnailPath) {
        const thumbName = path.basename(existingVideo.thumbnailPath);
        const oldThumbPath = path.join(process.cwd(), 'uploads', thumbName);
        try {
          await fs.promises.unlink(oldThumbPath);
          console.log(`Deleted old thumbnail: ${thumbName}`);
        } catch (err) {
          console.warn(`Could not delete old thumbnail: ${err.message}`);
        }
      }
    }

    //Save to PostgreSQL using UPSERT (Update if exists, Create if new)
    const video = await prisma.video.upsert({
      where: { 
        projectId: projectId 
      },
      update: {
        // If a video already exists for this project, overwrite it with the new file
        fileName: finalFilename,
        originalName: originalName,
        mimeType: mimeType || 'video/mp4',
        fileSize: finalStats.size,
        filePath: `/uploads/${finalFilename}`,
      },
      create: {
        // If no video exists for this project yet, create it normally
        fileName: finalFilename,
        originalName: originalName,
        mimeType: mimeType || 'video/mp4',
        fileSize: finalStats.size,
        filePath: `/uploads/${finalFilename}`,
        projectId: projectId,
      },
    });

    await videoQueue.add('generate-thumbnail', {
      videoId: video.id,
      filePath: video.filePath,
      fileName: finalFilename
    });


    res.status(201).json({
      message: 'Upload complete! Video merged successfully.',
      filename: `${uploadId}.mp4`,
      size: finalStats.size
    });

  } catch (error) {
    console.error('Merge Upload Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to complete video merge.' });
    }
  }
};

const checkUploadStatus = async (req, res) => {
 try {
    const { uploadId } = req.params;

    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId is required.' });
    }

    const tempDirPath = path.join(process.cwd(), 'uploads', 'temp', uploadId);

    try {
      await fs.promises.access(tempDirPath);
    } catch (err) {
      return res.status(200).json({ 
        message: 'No active session found.',
        uploadedChunks: [] 
      });
    }

    const chunkFiles = await fs.promises.readdir(tempDirPath);
    
    const uploadedChunks = chunkFiles
      .filter(file => file.startsWith("chunk-"))
      .map((file) => Number(file.split("-")[1]))
      .sort((a, b) => a - b);

    res.status(200).json({
      message: 'Upload status retrieved successfully.',
      uploadedChunks
    });

  } catch (error) {
    console.error('Check Upload Status Error:', error);
    res.status(500).json({ error: 'Failed to retrieve upload status.' });
  }
};
module.exports = { initializeUpload ,uploadChunk , completeUpload, checkUploadStatus};