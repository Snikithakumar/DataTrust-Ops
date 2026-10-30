const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { scanQuality } = require('../controllers/qualityController');

// Accept multipart file (field 'file') or JSON body
router.post('/scan', upload.single('file'), scanQuality);

module.exports = router;
