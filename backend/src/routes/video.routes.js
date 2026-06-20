const express = require('express');
const { uploadVideo } = require('../controllers/video.controller');
const { protect } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

const router = express.Router();

router.post('/upload/:projectId', protect, upload.single('demoVideo'), uploadVideo);

module.exports = router;