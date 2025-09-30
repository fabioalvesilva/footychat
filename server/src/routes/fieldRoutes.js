const express = require('express');
const router = express.Router();
const {
  getNearbyFields,
  getField,
  checkAvailability
} = require('../controllers/fieldController');

// Rotas públicas (não precisam autenticação)
router.get('/nearby', getNearbyFields);
router.get('/:id', getField);
router.get('/:id/availability', checkAvailability);

module.exports = router;