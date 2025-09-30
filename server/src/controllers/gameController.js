// server/src/controllers/gameController.js

const { Game, Group, Field, Notification, User } = require('../models'); // ✅ User adicionado aqui!

// @desc    Criar novo jogo
// @route   POST /api/games
// @access  Private (Admin do grupo)
exports.createGame = async (req, res) => {
  try {
    const {
      groupId,
      fieldId,
      dateTime,
      duration,
      minPlayers,
      maxPlayers,
      notes
    } = req.body;
    
    // Verificar se user é admin do grupo
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }
    
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Apenas admins podem criar jogos' });
    }
    
    // Buscar campo e calcular preço
    const field = await Field.findById(fieldId);
    if (!field) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }
    
    const price = field.calculatePrice('7v7', new Date(dateTime), duration || 90);
    
    // Criar jogo
    const game = await Game.create({
      group: groupId,
      field: fieldId,
      dateTime,
      duration: duration || 90,
      players: {
        min: minPlayers || 10,
        max: maxPlayers || 14,
        confirmed: [{
          user: req.user._id,
          confirmedAt: new Date()
        }]
      },
      cost: {
        fieldPrice: price.finalPrice,
        perPlayer: price.finalPrice / (minPlayers || 10)
      },
      notes,
      createdBy: req.user._id
    });
    
    // Criar notificações para todos os membros
    const memberIds = group.members
      .filter(m => m.user.toString() !== req.user._id.toString())
      .map(m => m.user);
    
    await Notification.createGameNotification(
      'game_invitation',
      game,
      memberIds
    );
    
    // Emitir evento via socket
    const io = req.app.get('io');
    io.to(groupId.toString()).emit('game_created', {
      game: await game.populate('field', 'name location')
    });
    
    res.status(201).json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Erro ao criar jogo:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Listar jogos do grupo
// @route   GET /api/games?groupId=xxx
// @access  Private
exports.getGames = async (req, res) => {
  try {
    const { groupId, status, upcoming } = req.query;
    
    let query = {};
    
    if (groupId) {
      // Verificar se user é membro
      const group = await Group.findById(groupId);
      const isMember = group?.members.some(
        m => m.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({ error: 'Não és membro deste grupo' });
      }
      
      query.group = groupId;
    } else {
      // Buscar jogos de todos os grupos do user
      const user = await User.findById(req.user._id); // ✅ Agora User está definido!
      if (!user) {
        return res.status(404).json({ error: 'Utilizador não encontrado' });
      }
      query.group = { $in: user.groups };
    }
    
    if (status) query.status = status;
    
    if (upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
    }
    
    const games = await Game.find(query)
      .populate('field', 'name location amenities')
      .populate('group', 'name')
      .populate('players.confirmed.user', 'name avatar')
      .sort('dateTime');
    
    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    console.error('Erro ao listar jogos:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get jogo específico
// @route   GET /api/games/:id
// @access  Private
exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('field')
      .populate('group', 'name members')
      .populate('players.confirmed.user', 'name avatar phoneNumber')
      .populate('players.declined.user', 'name');
    
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    
    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Erro ao buscar jogo:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Confirmar presença no jogo
// @route   POST /api/games/:id/confirm
// @access  Private
exports.confirmAttendance = async (req, res) => {
  try {
    const gameId = req.params.id;
    const userId = req.user._id;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    
    // Verificar se já confirmou
    const alreadyConfirmed = game.players.confirmed.some(
      p => p.user.toString() === userId.toString()
    );
    
    if (alreadyConfirmed) {
      return res.status(400).json({ error: 'Já confirmaste presença' });
    }
    
    // Confirmar presença
    await game.confirmPlayer(userId);
    
    // Emitir evento
    const io = req.app.get('io');
    io.to(game.group.toString()).emit('player_confirmed', {
      gameId,
      userId,
      userName: req.user.name
    });
    
    res.json({
      success: true,
      message: 'Presença confirmada'
    });
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Cancelar presença no jogo
// @route   DELETE /api/games/:id/confirm
// @access  Private
exports.cancelAttendance = async (req, res) => {
  try {
    const gameId = req.params.id;
    const userId = req.user._id;
    const { reason } = req.body;
    
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    
    // Cancelar presença
    await game.cancelPlayer(userId, reason);
    
    // Emitir evento
    const io = req.app.get('io');
    io.to(game.group.toString()).emit('player_cancelled', {
      gameId,
      userId,
      userName: req.user.name
    });
    
    res.json({
      success: true,
      message: 'Presença cancelada'
    });
  } catch (error) {
    console.error('Erro ao cancelar presença:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Cancelar jogo
// @route   DELETE /api/games/:id
// @access  Private (Admin only)
exports.cancelGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { reason } = req.body;
    
    const game = await Game.findById(gameId)
      .populate('group');
    
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }
    
    // Verificar se é admin
    if (!game.group.isAdmin(req.user._id)) {
      return res.status(403).json({ error: 'Apenas admins podem cancelar jogos' });
    }
    
    // Verificar se pode ser cancelado
    if (!game.canBeCancelled()) {
      return res.status(400).json({ 
        error: 'Jogo não pode ser cancelado (muito próximo da hora)' 
      });
    }
    
    // Cancelar jogo
    game.status = 'cancelled';
    game.cancellation = {
      reason,
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };
    await game.save();
    
    // Notificar todos os confirmados
    const playerIds = game.players.confirmed.map(p => p.user);
    await Notification.createGameNotification(
      'game_cancelled',
      game,
      playerIds
    );
    
    res.json({
      success: true,
      message: 'Jogo cancelado'
    });
  } catch (error) {
    console.error('Erro ao cancelar jogo:', error);
    res.status(500).json({ error: error.message });
  }
};