const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');

const prisma = new PrismaClient();

const STORAGE_NODES = [
  { id: 'node-a', url: process.env.NODE_A_URL },
  { id: 'node-b', url: process.env.NODE_B_URL },
  { id: 'node-c', url: process.env.NODE_C_URL }
];

const selectStorageNode = (chunkIndex) => {
  return STORAGE_NODES[chunkIndex % STORAGE_NODES.length];
};

const saveChunk = async (uploadId, chunkIndex, tempFilePath, projectId, totalChunks) => {

  const targetNode = selectStorageNode(chunkIndex);

  const form = new FormData();
  form.append('uploadId', uploadId);
  form.append('chunkIndex', chunkIndex);
  form.append('chunk', fs.createReadStream(tempFilePath));

  const targetUrl = `${targetNode.url}/chunks`;
  console.log(`Forwarding Chunk ${chunkIndex} over HTTP to ${targetNode.id}...`);

  try {
    const response = await axios.post(targetUrl, form, {
      headers: { ...form.getHeaders() }
    });
  } catch (error) {
    throw new Error(`CRITICAL: Failed to send chunk over network to ${targetNode.id }.`);
  }

  await fs.promises.unlink(tempFilePath);

  
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
      nodeId: targetNode.id,
    },
    create: {
      chunkIndex: chunkIndex,
      nodeId: targetNode.id,
      uploadSessionId: session.id
    }
  });

  console.log(`[Router] Saved Chunk ${chunkIndex} to ${targetNode.id} and Ledger`);
  return { node: targetNode.id };
};




const mergeChunks = async (uploadId, finalFilePath) => {
  console.log(`[Merger] Reading Ledger for upload ${uploadId}...`);
  
  const session = await prisma.uploadSession.findUnique({
    where: { uploadId: uploadId },
    include: {
      chunks: { orderBy: { chunkIndex: 'asc' } }
    }
  });

  if (!session) throw new Error(`CRITICAL: Upload session ${uploadId} not found.`);

  const writeStream = fs.createWriteStream(finalFilePath);

  for (const chunk of session.chunks) {
    const targetNode = STORAGE_NODES.find(n => n.id === chunk.nodeId);
    if (!targetNode) throw new Error(`Unknown node: ${chunk.nodeId}`);

    const downloadUrl = `${targetNode.url}/chunks/${uploadId}/${chunk.chunkIndex}`;
    console.log(`[Merger] Downloading Chunk ${chunk.chunkIndex} from ${targetNode.id}...`);

    try {
      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream' 
      });

      await new Promise((resolve, reject) => {
        response.data.pipe(writeStream, { end: false });
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    } catch (err) {
      writeStream.destroy();
      await fs.promises.rm(finalFilePath,{
        force:true
      });
      throw new Error(`CRITICAL: Failed to download chunk ${chunk.chunkIndex} from ${targetNode.id}`);
    }
  }

   await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    writeStream.end();
  });

  console.log(`[Merger] Downloaded and stitched ${session.totalChunks} chunks perfectly!`);

  console.log(`Sending cleanup orders to storage nodes...`);
  
  for (const chunk of session.chunks) {
    const targetNode = STORAGE_NODES.find(n => n.id === chunk.nodeId);
    if (targetNode) {
      const deleteUrl = `${targetNode.url}/chunks/${uploadId}/${chunk.chunkIndex}`;
      try {
        // Send the HTTP DELETE request
        await axios.delete(deleteUrl);
      } catch (err) {
        console.warn(`Failed to tell ${targetNode.id} to delete chunk ${chunk.chunkIndex}`);
      }
    }
  }

  await prisma.uploadSession.delete({
    where: { id: session.id }
  });


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