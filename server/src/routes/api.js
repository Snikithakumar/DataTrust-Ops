const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const qualityRoutes = require('./qualityRoutes');
const incidentRoutes = require('./incidentRoutes');

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/quality', qualityRoutes);
router.use('/incidents', incidentRoutes);

module.exports = router;
