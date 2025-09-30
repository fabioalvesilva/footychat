const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  dateTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    default: 90, // minutos
    min: 30,
    max: 180
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'confirmed', 'playing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  players: {
    min: {
      type: Number,
      default: 10,
      min: 4
    },
    max: {
      type: Number,
      default: 14,
      max: 30
    },
    confirmed: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      confirmedAt: {
        type: Date,
        default: Date.now
      },
      team: {
        type: String,
        enum: ['A', 'B', null],
        default: null
      },
      position: {
        type: String,
        enum: ['GK', 'DEF', 'MID', 'FWD', null],
        default: null
      },
      isPaid: {
        type: Boolean,
        default: false
      }
    }],
    pending: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    declined: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      declinedAt: Date
    }],
    waitlist: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  teams: {
    teamA: {
      name: String,
      color: String,
      players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    teamB: {
      name: String,
      color: String,
      players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    autoGenerate: {
      type: Boolean,
      default: false
    }
  },
  cost: {
    fieldPrice: {
      type: Number,
      required: true
    },
    perPlayer: {
      type: Number,
      default: 0
    },
    additionalCosts: [{
      description: String,
      amount: Number
    }],
    paid: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      method: {
        type: String,
        enum: ['cash', 'mbway', 'transfer', 'app']
      },
      paidAt: Date
    }]
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    parentGame: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    endDate: Date
  },
  results: {
    scoreTeamA: {
      type: Number,
      min: 0
    },
    scoreTeamB: {
      type: Number,
      min: 0
    },
    scorers: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      goals: {
        type: Number,
        min: 1
      },
      team: {
        type: String,
        enum: ['A', 'B']
      }
    }],
    assists: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assists: {
        type: Number,
        min: 1
      }
    }],
    cards: [{
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['yellow', 'red']
      },
      minute: Number
    }],
    mvp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  reminders: {
    dayBefore: {
      type: Boolean,
      default: true
    },
    hourBefore: {
      type: Boolean,
      default: true
    },
    sent: [{
      type: {
        type: String,
        enum: ['dayBefore', 'hourBefore', 'custom']
      },
      sentAt: Date
    }]
  },
  weather: {
    temperature: Number,
    condition: String,
    icon: String,
    lastUpdate: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices compostos para queries comuns
gameSchema.index({ group: 1, dateTime: -1 });
gameSchema.index({ field: 1, dateTime: 1 });
gameSchema.index({ status: 1, dateTime: 1 });

// Virtuals
gameSchema.virtual('confirmedCount').get(function() {
  return this.players.confirmed.length;
});

gameSchema.virtual('availableSpots').get(function() {
  return this.players.max - this.players.confirmed.length;
});

gameSchema.virtual('isFull').get(function() {
  return this.players.confirmed.length >= this.players.max;
});

gameSchema.virtual('totalCost').get(function() {
  const additionalTotal = this.cost.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  return this.cost.fieldPrice + additionalTotal;
});

// Métodos
gameSchema.methods = {
  // Confirmar presença
  async confirmPlayer(userId) {
    const isConfirmed = this.players.confirmed.some(
      p => p.user.toString() === userId.toString()
    );
    
    if (isConfirmed) {
      throw new Error('Jogador já confirmado');
    }
    
    if (this.isFull) {
      // Adicionar à lista de espera
      this.players.waitlist.push({ user: userId });
    } else {
      // Remover de pending se existir
      this.players.pending = this.players.pending.filter(
        id => id.toString() !== userId.toString()
      );
      
      // Adicionar aos confirmados
      this.players.confirmed.push({ user: userId });
      
      // Recalcular custo por jogador
      this.calculatePerPlayerCost();
    }
    
    return this.save();
  },
  
  // Cancelar presença
  async cancelPlayer(userId, reason = null) {
    this.players.confirmed = this.players.confirmed.filter(
      p => p.user.toString() !== userId.toString()
    );
    
    if (reason) {
      this.players.declined.push({
        user: userId,
        reason: reason,
        declinedAt: new Date()
      });
    }
    
    // Verificar lista de espera
    if (this.players.waitlist.length > 0) {
      const nextPlayer = this.players.waitlist.shift();
      this.players.confirmed.push({
        user: nextPlayer.user,
        confirmedAt: new Date()
      });
      
      // TODO: Enviar notificação ao jogador da lista de espera
    }
    
    // Recalcular custo
    this.calculatePerPlayerCost();
    
    return this.save();
  },
  
  // Calcular custo por jogador
  calculatePerPlayerCost() {
    const playerCount = this.players.confirmed.length || 1;
    this.cost.perPlayer = Math.ceil(this.totalCost / playerCount);
  },
  
  // Gerar equipas automáticas
  async generateTeams() {
    const confirmed = [...this.players.confirmed];
    
    // Embaralhar jogadores
    for (let i = confirmed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [confirmed[i], confirmed[j]] = [confirmed[j], confirmed[i]];
    }
    
    // Dividir em duas equipas
    const midPoint = Math.ceil(confirmed.length / 2);
    
    this.teams.teamA.players = confirmed.slice(0, midPoint).map(p => p.user);
    this.teams.teamB.players = confirmed.slice(midPoint).map(p => p.user);
    
    // Atualizar team nos jogadores confirmados
    this.players.confirmed.forEach(player => {
      if (this.teams.teamA.players.includes(player.user)) {
        player.team = 'A';
      } else if (this.teams.teamB.players.includes(player.user)) {
        player.team = 'B';
      }
    });
    
    return this.save();
  },
  
  // Verificar se pode ser cancelado
  canBeCancelled() {
    const hoursUntilGame = (this.dateTime - Date.now()) / (1000 * 60 * 60);
    return hoursUntilGame > 2; // Pode cancelar até 2 horas antes
  }
};

// Hooks
gameSchema.pre('save', function(next) {
  // Atualizar status baseado na data
  if (this.dateTime < Date.now() && this.status === 'scheduled') {
    this.status = 'completed';
  }
  
  // Calcular custo por jogador
  if (this.isModified('players.confirmed') || this.isModified('cost.fieldPrice')) {
    this.calculatePerPlayerCost();
  }
  
  next();
});

// Métodos estáticos
gameSchema.statics = {
  // Encontrar próximos jogos
  async findUpcoming(groupId, limit = 5) {
    return this.find({
      group: groupId,
      dateTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .sort('dateTime')
    .limit(limit)
    .populate('field', 'name location');
  },
  
  // Criar jogo recorrente
  async createRecurringGames(gameData, frequency, endDate) {
    const games = [];
    const currentDate = new Date(gameData.dateTime);
    
    while (currentDate <= endDate) {
      const newGame = new this({
        ...gameData,
        dateTime: new Date(currentDate),
        recurring: {
          isRecurring: true,
          frequency: frequency
        }
      });
      
      games.push(newGame);
      
      // Incrementar data baseado na frequência
      switch(frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return this.insertMany(games);
  }
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;