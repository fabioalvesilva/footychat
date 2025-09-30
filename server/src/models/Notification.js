const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'game_invitation',
      'game_reminder',
      'game_cancelled',
      'game_confirmed',
      'game_teams_set',
      'group_invitation',
      'group_joined',
      'message_mention',
      'payment_reminder'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  data: {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customData: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  read: {
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date
  },
  actions: [{
    type: {
      type: String,
      enum: ['confirm', 'decline', 'view']
    },
    label: String,
    url: String,
    taken: {
      type: Boolean,
      default: false
    },
    takenAt: Date
  }],
  scheduledFor: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Índices para queries comuns
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, 'read.isRead': 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

// TTL index para limpar notificações antigas automaticamente (30 dias)
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 }
);

// Virtuals
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Métodos de instância
notificationSchema.methods = {
  // Marcar como lida
  markAsRead() {
    this.read.isRead = true;
    this.read.readAt = new Date();
    this.status = 'read';
    return this.save();
  },
  
  // Marcar ação como tomada
  async takeAction(actionType) {
    const action = this.actions.find(a => a.type === actionType);
    
    if (!action) {
      throw new Error('Ação não encontrada');
    }
    
    if (action.taken) {
      throw new Error('Ação já foi tomada');
    }
    
    action.taken = true;
    action.takenAt = new Date();
    
    // Marcar notificação como lida
    if (!this.read.isRead) {
      this.read.isRead = true;
      this.read.readAt = new Date();
      this.status = 'read';
    }
    
    return this.save();
  }
};

// Métodos estáticos
notificationSchema.statics = {
  // Buscar notificações não lidas
  async getUnread(userId) {
    return this.find({
      recipient: userId,
      'read.isRead': false,
      status: { $ne: 'failed' },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .sort('-createdAt')
    .populate('data.group', 'name avatar')
    .populate('data.game', 'dateTime field')
    .populate('data.sender', 'name avatar');
  },
  
  // Criar notificação de jogo
  async createGameNotification(type, game, recipients, customData = {}) {
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type: type,
      title: this.getGameNotificationTitle(type),
      message: this.getGameNotificationMessage(type, game),
      data: {
        game: game._id,
        group: game.group,
        ...customData
      },
      priority: type === 'game_cancelled' ? 'high' : 'normal',
      actions: this.getGameNotificationActions(type)
    }));
    
    return this.insertMany(notifications);
  },
  
  // Obter título da notificação
  getGameNotificationTitle(type) {
    const titles = {
      'game_invitation': 'Novo Jogo Agendado!',
      'game_reminder': 'Lembrete de Jogo',
      'game_cancelled': 'Jogo Cancelado',
      'game_confirmed': 'Jogo Confirmado!',
      'game_teams_set': 'Equipas Definidas',
      'group_invitation': 'Convite para Grupo',
      'group_joined': 'Novo Membro no Grupo',
      'message_mention': 'Foste Mencionado',
      'payment_reminder': 'Pagamento Pendente'
    };
    
    return titles[type] || 'Notificação';
  },
  
  // Obter mensagem da notificação
  getGameNotificationMessage(type, game) {
    if (!game) return '';
    
    const date = new Date(game.dateTime).toLocaleDateString('pt-PT');
    const time = new Date(game.dateTime).toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const messages = {
      'game_invitation': `Jogo marcado para ${date} às ${time}. Confirma a tua presença!`,
      'game_reminder': `Não te esqueças do jogo hoje às ${time}!`,
      'game_cancelled': `O jogo de ${date} foi cancelado.`,
      'game_confirmed': `Jogo confirmado! ${game.players?.confirmed?.length || 0} jogadores confirmados.`,
      'game_teams_set': `As equipas para o jogo de ${date} foram definidas.`
    };
    
    return messages[type] || '';
  },
  
  // Obter ações da notificação
  getGameNotificationActions(type) {
    const actions = {
      'game_invitation': [
        { type: 'confirm', label: 'Confirmar' },
        { type: 'decline', label: 'Não Posso' },
        { type: 'view', label: 'Ver Detalhes' }
      ],
      'game_reminder': [
        { type: 'view', label: 'Ver Jogo' }
      ],
      'game_teams_set': [
        { type: 'view', label: 'Ver Equipas' }
      ],
      'group_invitation': [
        { type: 'confirm', label: 'Aceitar' },
        { type: 'decline', label: 'Recusar' }
      ]
    };
    
    return actions[type] || [{ type: 'view', label: 'Ver' }];
  },
  
  // Marcar todas como lidas
  async markAllAsRead(userId) {
    return this.updateMany(
      {
        recipient: userId,
        'read.isRead': false
      },
      {
        $set: {
          'read.isRead': true,
          'read.readAt': new Date(),
          status: 'read'
        }
      }
    );
  },
  
  // Contar não lidas
  async countUnread(userId) {
    return this.countDocuments({
      recipient: userId,
      'read.isRead': false,
      status: { $ne: 'failed' }
    });
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;