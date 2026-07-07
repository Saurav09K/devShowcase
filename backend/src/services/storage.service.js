const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const STORAGE_NODES = ['node-a', 'node-b', 'node-c'];

const saveChunk = async (uploadId, chunkIndex, tempFilePath, projectId, totalChunks) => {

  const nodeIndex = chunkIndex % STORAGE_NODES.length;
  const targetNode = STORAGE_NODES[nodeIndex];

  const nodeDirPath = path.join(process.cwd(), 'storage', targetNode, uploadId);
  const finalChunkPath = path.join(nodeDirPath, chunkIndex.toString());

  await fs.promises.mkdir(nodeDirPath, { recursive: true });
  await fs.promises.rename(tempFilePath, finalChunkPath);

 
  const session = await prisma.uploadSession.upsert({
    where: { uploadId: uploadId },
    update: {}, // Do nothing if it already exists
    create: {
      uploadId: uploadId,
      projectId: projectId,
      totalChunks: totalChunks
    }
  });

  
  await prisma.chunk.upsert({
    where: {
      uploadSessionId_chunkIndex: {
        uploadSessionId: session.id,
        chunkIndex: chunkIndex
      }
    },
    update: {
      nodeId: targetNode,
      chunkPath: finalChunkPath 
    },
    create: {
      chunkIndex: chunkIndex,
      nodeId: targetNode,
      chunkPath: finalChunkPath,
      uploadSessionId: session.id
    }
  });

  console.log(`[Router] Saved Chunk ${chunkIndex} to ${targetNode} and Ledger`);
  return { node: targetNode, chunkPath: finalChunkPath };
};

const mergeChunks = async (uploadId, finalFilePath) => {
  console.log(`[Merger] Reading Ledger for upload ${uploadId}...`);
  
  const session = await prisma.uploadSession.findUnique({
    where: { uploadId: uploadId },
    include: {
      chunks: {
        orderBy: { chunkIndex: 'asc' } 
      }
    }
  });

  if (!session) throw new Error(`CRITICAL: Upload session ${uploadId} not found.`);
  if (session.chunks.length !== session.totalChunks) {
    throw new Error(`CRITICAL: Expected ${session.totalChunks} chunks, DB only has ${session.chunks.length}.`);
  }

  for (let i = 0; i < session.totalChunks; i++) {
    if (session.chunks[i].chunkIndex !== i) {
        throw new Error(
            `Missing chunk ${i}`
        );
    }
  }

  const writeStream = fs.createWriteStream(finalFilePath);

  for (const chunk of session.chunks) {
    const chunkPath = chunk.chunkPath; 

    try {
      await fs.promises.access(chunkPath);
    } catch (err) {
      throw new Error(`CRITICAL: DB says chunk ${chunk.chunkIndex} is at ${chunkPath}, but file is missing!`);
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
  console.log(`[Merger] Stitched ${session.totalChunks} chunks perfectly!`);

 
  await prisma.uploadSession.delete({
    where: { id: session.id }
  });

  for (const node of STORAGE_NODES) {
    const nodeDirPath = path.join(process.cwd(), 'storage', node, uploadId);
    try { await fs.promises.rm(nodeDirPath, { recursive: true, force: true }); } catch(e) {}
  }

  return true;
};

const getFinalVideoPath = async (filename) => {
  const finalDir = path.join(process.cwd(), 'uploads');
  
  await fs.promises.mkdir(finalDir, { recursive: true });
  
  return path.join(finalDir, filename);
};


const getUploadedChunks = async (uploadId) => {
  console.log(`[Ledger] Checking uploaded chunks for ${uploadId}...`);

  const session = await prisma.uploadSession.findUnique({
    where: { uploadId: uploadId },
    include: {
      chunks: {
        select: { chunkIndex: true },
        orderBy: { chunkIndex: 'asc' } 
      }
    }
  });

  if (!session) {
    return [];
  }

  const uploadedChunks = session.chunks.map(chunk => chunk.chunkIndex);

  return uploadedChunks;
};

module.exports = { saveChunk, mergeChunks, getFinalVideoPath, getUploadedChunks };