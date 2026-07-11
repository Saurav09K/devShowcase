const storageService = require('../services/storage.services');
const config = require('../config/storage');
const path = require('path');
const fs = require('fs');

const uploadChunk = async (req, res) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    const file = req.file;

    if (!uploadId || chunkIndex === undefined || !file) {
      return res.status(400).json({ error: 'Missing required fields: chunk, uploadId, or chunkIndex' });
    }

    await storageService.saveChunk(uploadId, chunkIndex, file.path);

    res.status(200).json({
      success: true,
      node: config.NODE_ID
    });

  } catch (error) {
    console.error(`[${config.NODE_ID}] Error saving chunk:`, error);
    res.status(500).json({ error: 'Storage node failed to save chunk' });
  }
};


const downloadChunk = (req, res) => {
  const { uploadId, chunkIndex } = req.params;
  
  // Construct the path: src/data/uploadId/chunk-5
  const chunkPath = path.resolve(config.STORAGE_PATH, uploadId, `chunk-${chunkIndex}`);

  if (!fs.existsSync(chunkPath)) {
    return res.status(404).json({ error: 'Chunk not found on this node' });
  }

  console.log(`[${config.NODE_ID}] Serving Chunk ${chunkIndex} to Coordinator`);
  
  res.sendFile(chunkPath);
};

const deleteChunk = async (req, res) => {
  const { uploadId, chunkIndex } = req.params;
  
  const chunkPath = path.resolve(config.STORAGE_PATH, uploadId, `chunk-${chunkIndex}`);
  const dirPath = path.resolve(config.STORAGE_PATH, uploadId);

  try {
    if (fs.existsSync(chunkPath)) {
      await fs.promises.unlink(chunkPath);
      console.log(`[${config.NODE_ID}] Deleted Chunk ${chunkIndex} for ${uploadId}`);
    }

    try {
      await fs.promises.rmdir(dirPath);
      console.log(`[${config.NODE_ID}] Cleaned up empty folder for ${uploadId}`);
    } catch (e) {
    }

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(`[${config.NODE_ID}] Delete failed:`, error);
    res.status(500).json({ error: 'Failed to delete chunk' });
  }
};

module.exports = { uploadChunk, downloadChunk, deleteChunk };