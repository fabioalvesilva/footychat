const { Group, User } = require('../models');

// @desc    Criar novo grupo
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;
    
    // Criar grupo
    const group = await Group.create({
      name,
      description,
      members: [{
        user: userId,
        role: 'admin'
      }],
      createdBy: userId
    });
    
    // Adicionar grupo ao user
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });
    
    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Listar grupos do user
// @route   GET /api/groups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const groups = await Group.find({
      'members.user': userId
    })
    .populate('members.user', 'name avatar')
    .sort('-lastActivity');
    
    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get grupo específico
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name avatar phoneNumber')
      .populate('settings.defaultField', 'name location');
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Verificar se user é membro
    const isMember = group.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ error: 'Não és membro deste grupo' });
    }
    
    res.json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Adicionar membro ao grupo
// @route   POST /api/groups/:id/members
// @access  Private (Admin only)
exports.addMember = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const groupId = req.params.id;
    
    // Buscar grupo
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Verificar se user é admin
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Apenas admins podem adicionar membros' });
    }
    
    // Buscar user pelo número
    const userToAdd = await User.findOne({ phoneNumber });
    
    if (!userToAdd) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    // Adicionar ao grupo
    await group.addMember(userToAdd._id);
    
    // Adicionar grupo ao user
    await User.findByIdAndUpdate(userToAdd._id, {
      $addToSet: { groups: groupId }
    });
    
    // Emitir evento via socket
    const io = req.app.get('io');
    io.to(groupId).emit('member_added', {
      group: groupId,
      user: {
        id: userToAdd._id,
        name: userToAdd.name,
        avatar: userToAdd.avatar
      }
    });
    
    res.json({
      success: true,
      message: 'Membro adicionado com sucesso'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Sair do grupo
// @route   DELETE /api/groups/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    // Verificar se é o único admin
    const admins = group.members.filter(m => m.role === 'admin');
    if (admins.length === 1 && admins[0].user.toString() === userId.toString()) {
      return res.status(400).json({ 
        error: 'Não podes sair sendo o único admin. Promove outro membro primeiro.' 
      });
    }
    
    // Remover do grupo
    await group.removeMember(userId);
    
    // Remover grupo do user
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId }
    });
    
    res.json({
      success: true,
      message: 'Saíste do grupo'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};