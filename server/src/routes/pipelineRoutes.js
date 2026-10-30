const express = require('express');
const router = express.Router();
const { getPipelines, runPipeline } = require('../controllers/pipelineController');

router.get('/', getPipelines);
router.post('/run', runPipeline);

module.exports = router;
