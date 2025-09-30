const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroup,
  addMember,
  leaveGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect); // Todas as rotas precisam autenticação

router.route('/')
  .get(getMyGroups)
  .post(createGroup);

router.route('/:id')
  .get(getGroup);

router.post('/:id/members', addMember);
router.delete('/:id/leave', leaveGroup);

module.exports = router;