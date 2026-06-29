const { v4: uuidv4 } = require("uuid");
const fs = require('fs');
const path = require("path");
const prisma = require("../lib/prisma");
const { videoQueue } = require("../lib/queue");

// @desc    Initialize a chunked upload session
// @route   POST /api/upload/init
// @access  Private
const initializeUpload = async (req,res)=>{
    const uploadId = uuidv4();

    try{

    const uploadDir = path.join(process.cwd(),"uploads","temp",uploadId);
    await fs.promises.mkdir(uploadDir, {
      recursive: true,
    });

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

    const tempDirPath = path.join(process.cwd(), 'uploads', 'temp', uploadId);

    //Does this upload session actually exist
    try {
      await fs.promises.access(tempDirPath);
    } catch (err) {
      // If the folder doesn't exist
      return res.status(404).json({ error: 'Upload session not found. Please restart upload.' });
    }

    const targetChunkPath = path.join(tempDirPath, `chunk-${chunkIndex}`);

    await fs.promises.rename(chunkFile.path, targetChunkPath);

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
    const { uploadId,originalName, mimeType, projectId } = req.body;

    if (!uploadId || !originalName || !projectId) {
      return res.status(400).json({ error: 'Missing required fields to complete upload.' });
    }

    const tempDirPath = path.join(process.cwd(), 'uploads', 'temp', uploadId);

    //verifying the  folder exists
    try {
      await fs.promises.access(tempDirPath);
    } catch (err) {
      return res.status(404).json({ error: 'Upload session not found or already completed.' });
    }

    const chunks = await fs.promises.readdir(tempDirPath);

    if (chunks.length === 0) {
        return res.status(400).json({ error: 'No chunks found to merge.' });
    }

    chunks.sort((a, b) => {
      const aNum = Number(a.split("-")[1]);
      const bNum = Number(b.split("-")[1]);
      return aNum - bNum;
    });

    const finalDir  = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(finalDir, { recursive: true });

    const finalVideoPath = path.join(finalDir,`${uploadId}.mp4`);
    const writeStream = fs.createWriteStream(finalVideoPath);

    // 4. Stitch chunks together synchronously
    for (const chunk of chunks) {
      const chunkPath = path.join(tempDirPath, chunk);
      
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        
        readStream.pipe(writeStream, { end: false }); 
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
    }

    //properly waiting for the write stream to finish clearing to disk
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    const finalStats = await fs.promises.stat(finalVideoPath);

    // Clean up the temp folder BEFORE sending the response
    await fs.promises.rm(tempDirPath, {recursive: true,force: true});

    const finalFilename = `${uploadId}.mp4`;

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
      filePath: video.filePath
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