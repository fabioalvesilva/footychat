// server/src/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  content: {
    text: {
      type: String,
      maxLength: 1000
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'game_invite', 'poll', 'location', 'system'],
      default: 'text'
    },
    // Para diferentes tipos de conteúdo
    media: {
      url: String,
      thumbnail: String,
      duration: Number, // para áudio/vídeo em segundos
      size: Number, // tamanho em bytes
      mimeType: String
    },
    gameInvite: {
      game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
      },
      message: String
    },
    poll: {
      question: {
        type: String,
        required: function() { return this.content.type === 'poll'; }
      },
      options: [{
        id: mongoose.Schema.Types.ObjectId,
        text: String,
        votes: [{
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          votedAt: Date
        }]
      }],
      allowMultiple: {
        type: Boolean,
        default: false
      },
      expiresAt: Date,
      isAnonymous: {
        type: Boolean,
        default: false
      }
    },
    location: {
      coordinates: [Number],
      address: String,
      name: String
    },
    system: {
      action: String, // 'user_joined', 'user_left', 'game_created', etc.
      metadata: mongoose.Schema.Types.Mixed
    }
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    editHistory: [{
      text: String,
      editedAt: Date
    }]
  },
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deleteType: {
      type: String,
      enum: ['soft', 'hard'],
      default: 'soft'
    }
  },
  pinned: {
    isPinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: Date,
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  forwarded: {
    isForwarded: {
      type: Boolean,
      default: false
    },
    originalMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    forwardCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Índices compostos para queries de chat
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ 'deleted.isDeleted': 1, group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'pinned.isPinned': 1, group: 1 });

// TTL index para mensagens temporárias (opcional - comentado por defeito)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 dias

// Virtuals
messageSchema.virtual('isRead').get(function() {
  // Isto seria calculado baseado no user atual
  return this.readBy && this.readBy.length > 0;
});

messageSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

messageSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Métodos de instância
messageSchema.methods = {
  // Marcar como lido
  markAsRead(userId) {
    const alreadyRead = this.readBy.some(
      r => r.user.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
      this.readBy.push({
        user: userId,
        readAt: new Date()
      });
      return this.save();
    }
    return Promise.resolve(this);
  },
  
  // Marcar como entregue
  markAsDelivered(userId) {
    const alreadyDelivered = this.deliveredTo.some(
      d => d.user.toString() === userId.toString()
    );
    
    if (!alreadyDelivered) {
      this.deliveredTo.push({
        user: userId,
        deliveredAt: new Date()
      });
      return this.save();
    }
    return Promise.resolve(this);
  },
  
  // Adicionar reação
  async addReaction(userId, emoji) {
    const existingReaction = this.reactions.findIndex(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );
    
    if (existingReaction === -1) {
      this.reactions.push({
        user: userId,
        emoji: emoji
      });
    } else {
      // Remover reação se já existe
      this.reactions.splice(existingReaction, 1);
    }
    
    return this.save();
  },
  
  // Editar mensagem
  async editMessage(newText, userId) {
    if (this.sender.toString() !== userId.toString()) {
      throw new Error('Apenas o remetente pode editar a mensagem');
    }
    
    if (this.content.type !== 'text') {
      throw new Error('Apenas mensagens de texto podem ser editadas');
    }
    
    // Guardar histórico
    if (!this.edited.isEdited) {
      this.edited.editHistory = [];
    }
    
    this.edited.editHistory.push({
      text: this.content.text,
      editedAt: this.edited.editedAt || this.createdAt
    });
    
    this.content.text = newText;
    this.edited.isEdited = true;
    this.edited.editedAt = new Date();
    
    return this.save();
  },
  
  // Apagar mensagem
  async deleteMessage(userId, deleteType = 'soft') {
    const isOwner = this.sender.toString() === userId.toString();
    // Assumir que temos acesso ao grupo para verificar se é admin
    
    if (!isOwner) {
      // Verificar se é admin do grupo
      const Group = mongoose.model('Group');
      const group = await Group.findById(this.group);
      if (!group.isAdmin(userId)) {
        throw new Error('Sem permissões para apagar esta mensagem');
      }
    }
    
    this.deleted.isDeleted = true;
    this.deleted.deletedAt = new Date();
    this.deleted.deletedBy = userId;
    this.deleted.deleteType = deleteType;
    
    if (deleteType === 'hard') {
      // Limpar conteúdo
      this.content.text = '[Mensagem apagada]';
      this.content.media = undefined;
      this.content.gameInvite = undefined;
      this.content.poll = undefined;
    }
    
    return this.save();
  },
  
  // Votar numa poll
  async voteInPoll(userId, optionIds) {
    if (this.content.type !== 'poll') {
      throw new Error('Esta mensagem não é uma votação');
    }
    
    if (this.content.poll.expiresAt && this.content.poll.expiresAt < new Date()) {
      throw new Error('Esta votação já expirou');
    }
    
    const options = Array.isArray(optionIds) ? optionIds : [optionIds];
    
    if (!this.content.poll.allowMultiple && options.length > 1) {
      throw new Error('Apenas uma opção permitida');
    }
    
    // Remover votos anteriores do user
    this.content.poll.options.forEach(option => {
      option.votes = option.votes.filter(
        v => v.user.toString() !== userId.toString()
      );
    });
    
    // Adicionar novos votos
    options.forEach(optionId => {
      const option = this.content.poll.options.find(
        o => o.id.toString() === optionId.toString()
      );
      
      if (option) {
        option.votes.push({
          user: userId,
          votedAt: new Date()
        });
      }
    });
    
    return this.save();
  }
};

// Hooks
messageSchema.pre('save', function(next) {
  // Extrair menções do texto
  if (this.content.text && this.isNew) {
    const mentions = this.content.text.match(/@(\w+)/g);
    if (mentions) {
      // Aqui seria necessário mapear usernames para IDs
      // this.mentions = await User.find({ username: { $in: mentions } });
    }
  }
  next();
});

// Métodos estáticos
messageSchema.statics = {
  // Buscar mensagens do grupo com paginação
  async getGroupMessages(groupId, page = 1, limit = 50, before = null) {
    const query = {
      group: groupId,
      'deleted.isDeleted': { $ne: true }
    };
    
    if (before) {
      query.createdAt = { $lt: before };
    }
    
    return this.find(query)
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content.text sender')
      .populate('content.gameInvite.game', 'dateTime field status');
  },
  
  // Buscar mensagens pinadas
  async getPinnedMessages(groupId) {
    return this.find({
      group: groupId,
      'pinned.isPinned': true,
      'deleted.isDeleted': { $ne: true }
    })
    .sort('-pinned.pinnedAt')
    .populate('sender', 'name avatar');
  },
  
  // Buscar mensagens não lidas
  async getUnreadMessages(groupId, userId, after) {
    return this.find({
      group: groupId,
      createdAt: { $gt: after },
      'deleted.isDeleted': { $ne: true },
      'readBy.user': { $ne: userId }
    })
    .sort('createdAt')
    .populate('sender', 'name avatar');
  },
  
  // Estatísticas de mensagens
  async getMessageStats(groupId, period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    return this.aggregate([
      {
        $match: {
          group: mongoose.Types.ObjectId(groupId),
          createdAt: { $gte: startDate },
          'deleted.isDeleted': { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sender: '$sender'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalMessages: { $sum: '$count' },
          activeUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;