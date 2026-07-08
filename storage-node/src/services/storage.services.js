const fs = require('fs');
const path = require('path');
const config = require('../config/storage');

const saveChunk = async (uploadId, chunkIndex, tempFilePath) => {
  const dirPath = path.resolve(config.STORAGE_PATH, uploadId);
  
  const finalFilePath = path.join(dirPath, `chunk-${chunkIndex}`);

  await fs.promises.mkdir(dirPath, { recursive: true });
  await fs.promises.rename(tempFilePath, finalFilePath);

  console.log(`[${config.NODE_ID}] Saved Chunk ${chunkIndex} for ${uploadId}`);
  
  return finalFilePath;
};

module.exports = { saveChunk };