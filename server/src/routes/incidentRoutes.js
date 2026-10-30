const express = require('express');
const router = express.Router();
const {
  getIncidents,
  updateIncident,
  explainIncident
} = require('../controllers/incidentController');

router.get('/', getIncidents);
router.patch('/:id', updateIncident);
router.post('/:id/explain', explainIncident);

module.exports = router;
