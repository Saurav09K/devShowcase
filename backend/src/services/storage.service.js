const fs = require('fs');
const path = require('path');

const STORAGE_NODES = ['node-a', 'node-b', 'node-c'];

// (Used in POST /chunk)
const saveChunk = async (uploadId, chunkIndex, tempFilePath) => {
  const nodeIndex = chunkIndex % STORAGE_NODES.length;
  const targetNode = STORAGE_NODES[nodeIndex];

  const nodeDirPath = path.join(process.cwd(), 'storage', targetNode, uploadId);
  const finalChunkPath = path.join(nodeDirPath, chunkIndex.toString());

  await fs.promises.mkdir(nodeDirPath, { recursive: true });
  await fs.promises.rename(tempFilePath, finalChunkPath);

  console.log(`[Router] Sent Chunk ${chunkIndex} to ${targetNode}`);
  return { node: targetNode, chunkPath: finalChunkPath };
};

// (Used in POST /complete)
const mergeChunks = async (uploadId, totalChunks, finalFilePath) => {
  console.log(`[Merger] Starting distributed merge for ${uploadId}...`);
  
  const writeStream = fs.createWriteStream(finalFilePath);

  for (let i = 0; i < totalChunks; i++) {
    const nodeIndex = i % STORAGE_NODES.length;
    const targetNode = STORAGE_NODES[nodeIndex];
    
    const chunkPath = path.join(process.cwd(), 'storage', targetNode, uploadId, i.toString());

    try {
      await fs.promises.access(chunkPath);
    } catch (err) {
      throw new Error(`CRITICAL: Missing chunk ${i} on ${targetNode}`);
    }

    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(chunkPath);
      readStream.pipe(writeStream, { end: false });
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });

    await fs.promises.unlink(chunkPath);
  }

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);

    writeStream.end();
  });

  console.log(`[Merger] Successfully stitched ${totalChunks} chunks into final video!`);

  for (const node of STORAGE_NODES) {
    const nodeDirPath = path.join(process.cwd(), 'storage', node, uploadId);
    try {
      await fs.promises.rm(nodeDirPath, { recursive: true, force: true });
    } catch(e) { /* Ignore if empty */ }
  }

  return true;
};

const getFinalVideoPath = async (filename) => {
  const finalDir = path.join(process.cwd(), 'uploads');
  
  await fs.mkdir(finalDir, { recursive: true });
  
  return path.join(finalDir, filename);
};

const getUploadedChunks = async (uploadId) => {
  const uploadedChunks = [];

  for (const node of STORAGE_NODES) {
    const nodeDir = path.join(process.cwd(), 'storage',node, uploadId);
    
    try {
      const files = await fs.readdir(nodeDir);
      
      for (const file of files) {
        if (file.startsWith("chunk-")) {
          const index = Number(file.split("-")[1]);
          uploadedChunks.push(index);
        }
      }
    } catch (err) {
      // If the folder doesn't exist on this node, it just means 
      // no chunks have been routed here yet. ignore it.
    }
  }

  return uploadedChunks.sort((a, b) => a - b);
};

module.exports = { saveChunk, mergeChunks, getFinalVideoPath, getUploadedChunks };