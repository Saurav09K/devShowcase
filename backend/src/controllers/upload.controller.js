const { v4: uuidv4 } = require("uuid");
const fs = require('fs').promises;
const path = require("path");

// @desc    Initialize a chunked upload session
// @route   POST /api/upload/init
// @access  Private
const initializeUpload = async (req,res)=>{
    const uploadId = uuidv4();

    try{

    const uploadDir = path.join(process.cwd(),"uploads","temp",uploadId);
    await fs.mkdir(uploadDir, {
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
      await fs.access(tempDirPath);
    } catch (err) {
      // If the folder doesn't exist
      return res.status(404).json({ error: 'Upload session not found. Please restart upload.' });
    }

    const targetChunkPath = path.join(tempDirPath, chunkIndex);

    await fs.rename(chunkFile.path, targetChunkPath);

    res.status(200).json({ 
      message: `Chunk ${chunkIndex} stored successfully.`,
      chunkIndex: chunkIndex
    });

  } catch (error) {
    console.error('Chunk Upload Error:', error);
    res.status(500).json({ error: 'Failed to save chunk.' });
  }
}
module.exports = { initializeUpload ,uploadChunk};