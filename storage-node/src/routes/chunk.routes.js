const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadChunk } = require('../controllers/chunk.controller');

const router = express.Router();

//temporary place to drop incoming bytes for processing(multer handles this)
const tempPath = './temp';
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

const upload = multer({ dest: tempPath });

router.post('/', upload.single('chunk'), uploadChunk);

module.exports = router;