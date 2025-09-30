const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  getNotifications,
  markNotificationRead
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/profile', updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;