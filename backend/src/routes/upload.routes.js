const express = require('express');
const router = express.Router();
const multer = require('multer');

const { initializeUpload, uploadChunk, completeUpload, checkUploadStatus } = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');
//for catching binary chunks temporarily
const chunkUpload = multer({ dest: 'uploads/temp_raw/' });

router.post('/init',initializeUpload);
router.post('/chunk',protect,chunkUpload.single('chunk'),uploadChunk);
router.post('/complete',completeUpload);
router.get('/status/:uploadId', protect, checkUploadStatus);

module.exports = router;