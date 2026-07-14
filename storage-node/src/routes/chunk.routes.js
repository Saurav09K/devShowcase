const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadChunk, downloadChunk, deleteChunk } = require('../controllers/chunk.controller');

const router = express.Router();

//temporary place to drop incoming bytes for processing(multer handles this)
const tempPath = './temp';
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

const upload = multer({ dest: tempPath });

// POST /chunks
router.post('/', upload.single('chunk'), uploadChunk);

// GET /chunks/:uploadId/:chunkIndex
router.get('/:uploadId/:chunkIndex',downloadChunk);

// DELETE /chunks/:uploadId/:chunkIndex
router.delete('/:uploadId/:chunkIndex',deleteChunk);

module.exports = router;