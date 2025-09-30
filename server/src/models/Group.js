const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do grupo é obrigatório'],
    trim: true,
    maxLength: [50, 'Nome não pode exceder 50 caracteres']
  },
  avatar: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxLength: [500, 'Descrição não pode exceder 500 caracteres']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isPaying: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    maxMembers: {
      type: Number,
      default: 30,
      min: 10,
      max: 50
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    allowGuestPlayers: {
      type: Boolean,
      default: false
    },
    defaultField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    defaultGameDuration: {
      type: Number,
      default: 90 // minutos
    },
    recurringGames: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      time: String, // formato "HH:MM"
      field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field'
      },
      duration: Number,
      autoCreate: {
        type: Boolean,
        default: true
      }
    }],
    paymentSettings: {
      requireAdvancePayment: {
        type: Boolean,
        default: false
      },
      refundDeadlineHours: {
        type: Number,
        default: 24
      }
    }
  },
  stats: {
    totalGames: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    averageAttendance: { type: Number, default: 0 }
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
groupSchema.index({ name: 'text' });
groupSchema.index({ inviteCode: 1 });
groupSchema.index({ 'members.user': 1 });

// Virtuals
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

groupSchema.virtual('admins').get(function() {
  return this.members.filter(m => m.role === 'admin');
});

// Métodos
groupSchema.methods = {
  // Adicionar membro
  async addMember(userId, role = 'member') {
    const existingMember = this.members.find(
      m => m.user.toString() === userId.toString()
    );
    
    if (existingMember) {
      throw new Error('Utilizador já é membro do grupo');
    }
    
    this.members.push({
      user: userId,
      role: role
    });
    
    return this.save();
  },
  
  // Remover membro
  async removeMember(userId) {
    this.members = this.members.filter(
      m => m.user.toString() !== userId.toString()
    );
    return this.save();
  },
  
  // Verificar se é admin
  isAdmin(userId) {
    const member = this.members.find(
      m => m.user.toString() === userId.toString()
    );
    return member && member.role === 'admin';
  },
  
  // Gerar código de convite
  generateInviteCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.inviteCode = code;
    return code;
  }
};

// Middleware
groupSchema.pre('save', function(next) {
  // Atualizar lastActivity
  this.lastActivity = new Date();
  next();
});

// Método estático
groupSchema.statics.findByInviteCode = function(code) {
  return this.findOne({ inviteCode: code, isActive: true });
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;