const express = require('express');
const router = express.Router();
const {
  createGame,
  getGames,
  getGame,
  confirmAttendance,
  cancelAttendance,
  cancelGame
} = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getGames)
  .post(createGame);

router.route('/:id')
  .get(getGame)
  .delete(cancelGame);

router.post('/:id/confirm', confirmAttendance);
router.delete('/:id/confirm', cancelAttendance);

module.exports = router;