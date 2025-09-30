const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Número de telemóvel é obrigatório'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validação para números portugueses
        return /^(\+351)?9[1236]\d{7}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Número de telemóvel inválido'
    }
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minLength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxLength: [50, 'Nome não pode exceder 50 caracteres']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Email inválido'
    }
  },
  password: {
    type: String,
    minLength: 6,
    select: false // Não retorna password por defeito nas queries
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxLength: [200, 'Bio não pode exceder 200 caracteres']
  },
  location: {
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere' // Índice geoespacial para queries de proximidade
    }
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },
  preferences: {
    positions: [{
      type: String,
      enum: ['GK', 'DEF', 'MID', 'FWD']
    }],
    availability: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      timeSlots: [String]
    }],
    notifications: {
      gameReminders: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    }
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpiry: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhor performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual para nome completo formatado
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Métodos de instância
userSchema.methods = {
  // Verificar password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },
  
  // Gerar código de verificação
  generateVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = code;
    this.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    return code;
  },
  
  // Verificar código
  verifyCode(code) {
    return this.verificationCode === code && 
           this.verificationCodeExpiry > Date.now();
  }
};

// Hooks/Middleware
userSchema.pre('save', async function(next) {
  // Hash password se foi modificada
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Método estático para encontrar jogadores próximos
userSchema.statics.findNearbyPlayers = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance // em metros
      }
    }
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;