const storageService = require('../services/storage.services');
const config = require('../config/storage');

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

module.exports = { uploadChunk };