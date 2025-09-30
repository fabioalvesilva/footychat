// server/src/models/Field.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do campo é obrigatório'],
    trim: true,
    maxLength: [100, 'Nome não pode exceder 100 caracteres']
  },
  description: {
    type: String,
    maxLength: [1000, 'Descrição não pode exceder 1000 caracteres']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    address: {
      type: String,
      required: [true, 'Morada é obrigatória']
    },
    city: {
      type: String,
      required: [true, 'Cidade é obrigatória']
    },
    district: String,
    postalCode: {
      type: String,
      validate: {
        validator: function(v) {
          return /^\d{4}-\d{3}$/.test(v);
        },
        message: 'Código postal inválido (formato: XXXX-XXX)'
      }
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordenadas são obrigatórias'],
      index: '2dsphere',
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90; // latitude
        },
        message: 'Coordenadas inválidas'
      }
    },
    googleMapsUrl: String,
    nearbyTransport: [{
      type: {
        type: String,
        enum: ['metro', 'bus', 'train', 'tram']
      },
      name: String,
      distance: Number // em metros
    }],
    parkingSpaces: {
      type: Number,
      default: 0
    },
    landmarks: [String] // Pontos de referência próximos
  },
  contacts: {
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(\+351)?[239]\d{8}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Número de telefone inválido'
      }
    },
    alternativePhone: String,
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Email inválido'
      }
    },
    website: String,
    whatsapp: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      tiktok: String
    }
  },
  amenities: {
    type: {
      type: String,
      enum: ['natural_grass', 'synthetic', 'hybrid', 'indoor', 'beach', 'futsal'],
      required: [true, 'Tipo de campo é obrigatório']
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      default: 'good'
    },
    sizes: [{
      name: {
        type: String,
        enum: ['3v3', '5v5', '6v6', '7v7', '8v8', '9v9', '11v11', 'futsal'],
        required: true
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      dimensions: {
        length: Number, // em metros
        width: Number   // em metros
      }
    }],
    lighting: {
      available: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['LED', 'halogen', 'metal_halide', 'other']
      },
      quality: {
        type: String,
        enum: ['professional', 'good', 'basic']
      }
    },
    parking: {
      available: {
        type: Boolean,
        default: false
      },
      free: {
        type: Boolean,
        default: true
      },
      spaces: Number,
      covered: Boolean,
      security: Boolean
    },
    changingRooms: {
      available: {
        type: Boolean,
        default: false
      },
      quantity: {
        type: Number,
        default: 0
      },
      gender: {
        male: Number,
        female: Number,
        unisex: Number
      },
      lockers: Boolean,
      showers: Boolean,
      hotWater: Boolean,
      hairDryer: Boolean,
      accessible: Boolean // Para pessoas com mobilidade reduzida
    },
    equipment: {
      ballsProvided: {
        type: Boolean,
        default: false
      },
      ballsQuality: {
        type: String,
        enum: ['new', 'good', 'average', 'poor']
      },
      bibsProvided: {
        type: Boolean,
        default: false
      },
      conesProvided: Boolean,
      goalkeeperGloves: Boolean,
      firstAidKit: Boolean,
      defibrillator: Boolean,
      ballPump: Boolean,
      waterFountain: Boolean
    },
    facilities: {
      bar: {
        available: Boolean,
        hours: String
      },
      restaurant: {
        available: Boolean,
        hours: String,
        menu: String
      },
      vendingMachines: {
        drinks: Boolean,
        snacks: Boolean,
        sports: Boolean // Bebidas isotónicas, barras energéticas
      },
      wifi: {
        available: Boolean,
        free: Boolean,
        password: String
      },
      tvRoom: Boolean,
      meetingRoom: Boolean,
      kidsArea: Boolean,
      bbqArea: Boolean,
      terrace: Boolean,
      physioRoom: Boolean
    },
    accessibility: {
      wheelchairAccess: Boolean,
      accessibleParking: Boolean,
      accessibleToilets: Boolean,
      ramps: Boolean,
      elevator: Boolean
    },
    safety: {
      fencing: Boolean,
      security24h: Boolean,
      cctv: Boolean,
      emergencyExit: Boolean,
      fireExtinguishers: Boolean,
      insurance: Boolean
    }
  },
  pricing: [{
    size: {
      type: String,
      enum: ['3v3', '5v5', '6v6', '7v7', '8v8', '9v9', '11v11', 'futsal'],
      required: true
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    periods: [{
      name: {
        type: String,
        required: true // "Normal", "Peak", "Super Peak", "Weekend", etc.
      },
      description: String,
      hourlyRate: {
        type: Number,
        required: true,
        min: 0
      },
      minimumHours: {
        type: Number,
        default: 1
      },
      timeSlots: [{
        dayOfWeek: {
          type: [Number], // [0-6] onde 0 = Domingo
          validate: {
            validator: function(v) {
              return v.every(day => day >= 0 && day <= 6);
            },
            message: 'Dia da semana inválido'
          }
        },
        startTime: {
          type: String, // "HH:MM"
          required: true,
          validate: {
            validator: function(v) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: 'Formato de hora inválido (HH:MM)'
          }
        },
        endTime: {
          type: String, // "HH:MM"
          required: true,
          validate: {
            validator: function(v) {
              return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: 'Formato de hora inválido (HH:MM)'
          }
        }
      }],
      specialDates: [{
        date: Date,
        multiplier: Number // 1.5 = 50% mais caro
      }]
    }],
    packages: [{
      name: String, // "Pack 10 jogos", "Mensalidade"
      description: String,
      type: {
        type: String,
        enum: ['games_pack', 'monthly', 'quarterly', 'annual']
      },
      gamesIncluded: Number,
      price: Number,
      validityDays: Number,
      conditions: String
    }],
    additionalServices: [{
      name: String, // "Árbitro", "Filmagem", "Churrasco"
      price: Number,
      unit: {
        type: String,
        enum: ['per_game', 'per_hour', 'per_person', 'fixed']
      }
    }]
  }],
  availability: {
    schedule: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        required: true
      },
      openTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Formato de hora inválido'
        }
      },
      closeTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: 'Formato de hora inválido'
        }
      },
      breakTime: {
        start: String,
        end: String
      }
    }],
    holidays: [{
      date: Date,
      name: String,
      isClosed: Boolean,
      specialHours: {
        openTime: String,
        closeTime: String
      },
      priceMultiplier: {
        type: Number,
        default: 1
      }
    }],
    blockedSlots: [{
      startDateTime: {
        type: Date,
        required: true
      },
      endDateTime: {
        type: Date,
        required: true
      },
      reason: String,
      recurring: {
        isRecurring: {
          type: Boolean,
          default: false
        },
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly']
        },
        until: Date
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    maintenanceSchedule: [{
      dayOfWeek: Number,
      startTime: String,
      endTime: String,
      type: String // "Rega", "Corte relva", "Manutenção geral"
    }]
  },
  bookingRules: {
    advanceBooking: {
      minimum: {
        type: Number,
        default: 2 // horas
      },
      maximum: {
        type: Number,
        default: 720 // horas (30 dias)
      }
    },
    cancellation: {
      allowCancellation: {
        type: Boolean,
        default: true
      },
      deadlineHours: {
        type: Number,
        default: 24
      },
      refundPolicy: {
        type: String,
        enum: ['full', 'partial', 'credit', 'none'],
        default: 'full'
      },
      partialRefundPercentage: Number,
      cancellationFee: Number
    },
    payment: {
      requiresDeposit: {
        type: Boolean,
        default: false
      },
      depositPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      requiresFullPayment: {
        type: Boolean,
        default: false
      },
      paymentMethods: [{
        type: String,
        enum: ['cash', 'mbway', 'transfer', 'multibanco', 'card', 'paypal']
      }],
      paymentDeadline: {
        type: String,
        enum: ['immediate', 'before_game', '24h_before', '48h_before', 'weekly'],
        default: 'before_game'
      }
    },
    booking: {
      autoConfirm: {
        type: Boolean,
        default: true
      },
      requiresApproval: {
        type: Boolean,
        default: false
      },
      minimumPlayers: Number,
      maximumPlayers: Number,
      allowWaitlist: {
        type: Boolean,
        default: true
      },
      requiresRegistration: {
        type: Boolean,
        default: false
      },
      membersOnly: {
        type: Boolean,
        default: false
      }
    },
    recurring: {
      allowRecurring: {
        type: Boolean,
        default: true
      },
      maxRecurringWeeks: {
        type: Number,
        default: 52
      },
      requiresContract: {
        type: Boolean,
        default: false
      }
    }
  },
  promotions: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    code: {
      type: String,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['discount', 'package', 'freebie', 'early_bird', 'last_minute'],
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo'], // bogo = buy one get one
      required: function() { return this.type === 'discount'; }
    },
    discountValue: {
      type: Number,
      required: function() { return this.type === 'discount'; }
    },
    conditions: {
      minBookingHours: Number,
      minPlayers: Number,
      specificSizes: [String],
      specificDays: [Number],
      specificTimeSlots: [{
        startTime: String,
        endTime: String
      }],
      firstTimeOnly: Boolean,
      memberOnly: Boolean,
      maxUses: Number,
      maxUsesPerUser: Number
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    usageCount: {
      type: Number,
      default: 0
    },
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      usedAt: Date,
      booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    rating: {
      overall: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      fieldQuality: {
        type: Number,
        min: 1,
        max: 5
      },
      facilities: {
        type: Number,
        min: 1,
        max: 5
      },
      accessibility: {
        type: Number,
        min: 1,
        max: 5
      },
      valueForMoney: {
        type: Number,
        min: 1,
        max: 5
      },
      staff: {
        type: Number,
        min: 1,
        max: 5
      }
    },
    title: String,
    comment: {
      type: String,
      maxLength: [1000, 'Comentário não pode exceder 1000 caracteres']
    },
    pros: [String],
    cons: [String],
    images: [{
      url: String,
      caption: String
    }],
    verifiedBooking: {
      type: Boolean,
      default: false
    },
    helpfulVotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      helpful: Boolean,
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    response: {
      text: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: Date
    },
    reported: {
      isReported: {
        type: Boolean,
        default: false
      },
      reports: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: String,
        reportedAt: Date
      }]
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: Date
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    },
    aspects: {
      fieldQuality: { avg: Number, count: Number },
      facilities: { avg: Number, count: Number },
      accessibility: { avg: Number, count: Number },
      valueForMoney: { avg: Number, count: Number },
      staff: { avg: Number, count: Number }
    },
    lastCalculated: Date
  },
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    currentMonthBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    currentMonthRevenue: {
      type: Number,
      default: 0
    },
    averageOccupancyRate: {
      type: Number,
      default: 0
    },
    peakHours: [{
      hour: Number,
      dayOfWeek: Number,
      bookingCount: Number
    }],
    popularSizes: [{
      size: String,
      percentage: Number
    }],
    regularGroups: [{
      group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
      },
      bookingCount: Number,
      lastBooking: Date
    }],
    cancellationRate: {
      type: Number,
      default: 0
    },
    averageBookingDuration: {
      type: Number,
      default: 0
    },
    repeatCustomerRate: {
      type: Number,
      default: 0
    }
  },
  management: {
    owner: {
      name: String,
      company: String,
      nif: String,
      phone: String,
      email: String
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    moderators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permissions: [{
        type: String,
        enum: ['manage_bookings', 'manage_prices', 'manage_availability', 'manage_promotions', 'view_stats', 'respond_reviews']
      }],
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    staff: [{
      name: String,
      role: String,
      phone: String,
      schedule: String
    }]
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDocuments: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    verificationLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'certified'],
      default: 'basic'
    },
    badges: [{
      type: String,
      enum: ['eco_friendly', 'top_rated', 'best_value', 'professional', 'family_friendly', 'accessible']
    }]
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: true
    },
    features: {
      maxPhotos: {
        type: Number,
        default: 5
      },
      maxPromotions: {
        type: Number,
        default: 1
      },
      priorityListing: {
        type: Boolean,
        default: false
      },
      customBranding: {
        type: Boolean,
        default: false
      },
      analytics: {
        type: Boolean,
        default: false
      },
      apiAccess: {
        type: Boolean,
        default: false
      },
      supportLevel: {
        type: String,
        enum: ['community', 'email', 'priority', '24/7'],
        default: 'community'
      }
    },
    billing: {
      method: String,
      lastPayment: Date,
      nextPayment: Date,
      amount: Number,
      currency: {
        type: String,
        default: 'EUR'
      }
    }
  },
  seo: {
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    structuredData: mongoose.Schema.Types.Mixed
  },
  integrations: {
    googleMyBusiness: {
      connected: Boolean,
      placeId: String,
      syncEnabled: Boolean
    },
    facebook: {
      connected: Boolean,
      pageId: String,
      syncEvents: Boolean
    },
    instagram: {
      connected: Boolean,
      businessAccountId: String
    },
    calendar: {
      googleCalendar: String,
      outlookCalendar: String,
      icalUrl: String
    }
  },
  settings: {
    notifications: {
      newBooking: {
        email: Boolean,
        sms: Boolean,
        push: Boolean
      },
      cancellation: {
        email: Boolean,
        sms: Boolean,
        push: Boolean
      },
      review: {
        email: Boolean,
        sms: Boolean,
        push: Boolean
      },
      payment: {
        email: Boolean,
        sms: Boolean,
        push: Boolean
      }
    },
    privacy: {
      showPhone: {
        type: Boolean,
        default: true
      },
      showEmail: {
        type: Boolean,
        default: true
      },
      showExactLocation: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      enum: ['pt', 'en', 'es', 'fr'],
      default: 'pt'
    },
    timezone: {
      type: String,
      default: 'Europe/Lisbon'
    },
    currency: {
      type: String,
      default: 'EUR'
    }
  },
  flags: {
    featured: {
      type: Boolean,
      default: false
    },
    new: {
      type: Boolean,
      default: true
    },
    underMaintenance: {
      type: Boolean,
      default: false
    },
    temporarilyClosed: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivationReason: String,
  deactivatedAt: Date,
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compostos para queries comuns
fieldSchema.index({ name: 'text', description: 'text' });
fieldSchema.index({ 'location.coordinates': '2dsphere' });
fieldSchema.index({ 'location.city': 1, isActive: 1 });
fieldSchema.index({ 'rating.average': -1, 'rating.count': -1 });
fieldSchema.index({ 'verification.isVerified': 1, isActive: 1 });
fieldSchema.index({ 'seo.slug': 1 });
fieldSchema.index({ 'amenities.type': 1, 'amenities.sizes.name': 1 });
fieldSchema.index({ 'promotions.validUntil': 1, 'promotions.isActive': 1 });

// Virtuals
fieldSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.location.address,
    this.location.postalCode,
    this.location.city
  ].filter(Boolean);
  return parts.join(', ');
});

fieldSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todaySchedule = this.availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
  
  if (!todaySchedule) return false;
  
  // Verificar se está fechado temporariamente
  if (this.flags.temporarilyClosed || this.flags.underMaintenance) return false;
  
  // Verificar horário de funcionamento
  const isWithinHours = currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
  
  // Verificar se está no horário de pausa
  if (todaySchedule.breakTime) {
    const isInBreak = currentTime >= todaySchedule.breakTime.start && currentTime <= todaySchedule.breakTime.end;
    return isWithinHours && !isInBreak;
  }
  
  return isWithinHours;
});

fieldSchema.virtual('nextAvailableSlot').get(function() {
  // Calcular próximo horário disponível
  // Implementação dependeria da lógica de bookings
  return null;
});

fieldSchema.virtual('responseTime').get(function() {
  // Calcular tempo médio de resposta a bookings
  return '~30 minutos';
});

fieldSchema.virtual('hasPromotions').get(function() {
  const now = new Date();
  return this.promotions.some(p => 
    p.isActive && 
    p.validFrom <= now && 
    p.validUntil >= now
  );
});

// Métodos de instância
fieldSchema.methods = {
  // Calcular preço para um slot específico
  calculatePrice(size, dateTime, duration) {
    const pricing = this.pricing.find(p => p.size === size);
    if (!pricing) {
      throw new Error(`Tamanho ${size} não disponível neste campo`);
    }
    
    const date = new Date(dateTime);
    const dayOfWeek = date.getDay();
    const time = date.toTimeString().slice(0, 5);
    
    // Encontrar o período de preço aplicável
    let applicablePeriod = null;
    let baseRate = 0;
    
    for (const period of pricing.periods) {
      for (const slot of period.timeSlots) {
        if (slot.dayOfWeek.includes(dayOfWeek) &&
            time >= slot.startTime && 
            time <= slot.endTime) {
          applicablePeriod = period;
          baseRate = period.hourlyRate;
          break;
        }
      }
      if (applicablePeriod) break;
    }
    
    if (!applicablePeriod) {
      // Usar primeiro período como padrão
      applicablePeriod = pricing.periods[0];
      baseRate = applicablePeriod.hourlyRate;
    }
    
    // Calcular preço base
    const hours = duration / 60;
    let totalPrice = baseRate * hours;
    
    // Aplicar multiplicador de data especial
    const specialDate = applicablePeriod.specialDates?.find(sd => 
      sd.date.toDateString() === date.toDateString()
    );
    
    if (specialDate) {
      totalPrice *= specialDate.multiplier;
    }
    
    // Verificar feriados
    const holiday = this.availability.holidays?.find(h => 
      h.date.toDateString() === date.toDateString()
    );
    
    if (holiday?.priceMultiplier) {
      totalPrice *= holiday.priceMultiplier;
    }
    
    // Aplicar promoções ativas
    const activePromotion = this.getActivePromotion(date, size, duration);
    if (activePromotion) {
      totalPrice = this.applyPromotion(totalPrice, activePromotion);
    }
    
    return {
      basePrice: baseRate * hours,
      finalPrice: Math.round(totalPrice * 100) / 100,
      period: applicablePeriod.name,
      promotion: activePromotion?.title || null,
      currency: pricing.currency || 'EUR'
    };
  },
  
  // Verificar disponibilidade
  async isAvailable(dateTime, duration, size) {
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    // Verificar se está dentro do horário
    const dayOfWeek = startTime.getDay();
    const timeStr = startTime.toTimeString().slice(0, 5);
    const endTimeStr = endTime.toTimeString().slice(0, 5);
    
    const schedule = this.availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!schedule) return { available: false, reason: 'Campo fechado neste dia' };
    
    if (timeStr < schedule.openTime || endTimeStr > schedule.closeTime) {
      return { available: false, reason: 'Fora do horário de funcionamento' };
    }
    
    // Verificar feriados
    const holiday = this.availability.holidays?.find(h => 
      h.date.toDateString() === startTime.toDateString() && h.isClosed
    );
    if (holiday) {
      return { available: false, reason: `Fechado: ${holiday.name}` };
    }
    
    // Verificar bloqueios
    for (const block of this.availability.blockedSlots || []) {
      if (startTime >= block.startDateTime && startTime < block.endDateTime) {
        return { available: false, reason: block.reason || 'Horário bloqueado' };
      }
      if (endTime > block.startDateTime && endTime <= block.endDateTime) {
        return { available: false, reason: block.reason || 'Horário bloqueado' };
      }
    }
    
    // Verificar manutenção
    const maintenance = this.availability.maintenanceSchedule?.find(m => {
      return m.dayOfWeek === dayOfWeek && 
             timeStr >= m.startTime && 
             timeStr < m.endTime;
    });
    if (maintenance) {
      return { available: false, reason: `Manutenção: ${maintenance.type}` };
    }
    
    // Verificar reservas existentes (seria necessário consultar o modelo Game)
    const Game = mongoose.model('Game');
    const existingGames = await Game.find({
      field: this._id,
      status: { $in: ['scheduled', 'confirmed'] },
      $or: [
        // Jogo começa durante este período
        {
          dateTime: { $gte: startTime, $lt: endTime }
        },
        // Jogo termina durante este período
        {
          $expr: {
            $and: [
              { $gt: ['$dateTime', startTime] },
              { $lte: [{ $add: ['$dateTime', { $multiply: ['$duration', 60000] }] }, endTime] }
            ]
          }
        },
        // Este período está contido no jogo
        {
          dateTime: { $lte: startTime },
          $expr: {
            $gte: [{ $add: ['$dateTime', { $multiply: ['$duration', 60000] }] }, endTime]
          }
        }
      ]
    });
    
    if (existingGames.length > 0) {
      // Verificar se há campos do tamanho solicitado disponíveis
      const sizeConfig = this.amenities.sizes.find(s => s.name === size);
      if (!sizeConfig) {
        return { available: false, reason: 'Tamanho de campo não disponível' };
      }
      
      const bookedFields = existingGames.length;
      if (bookedFields >= sizeConfig.quantity) {
        return { available: false, reason: 'Todos os campos deste tamanho estão ocupados' };
      }
    }
    
    return { available: true, reason: null };
  },
  
  // Obter promoção ativa
  getActivePromotion(date, size, duration) {
    const now = date || new Date();
    const dayOfWeek = now.getDay();
    const time = now.toTimeString().slice(0, 5);
    
    return this.promotions.find(promo => {
      // Verificações básicas
      if (!promo.isActive) return false;
      if (now < promo.validFrom || now > promo.validUntil) return false;
      
      // Verificar condições
      const conditions = promo.conditions || {};
      
      if (conditions.minBookingHours && duration < conditions.minBookingHours * 60) return false;
      if (conditions.specificSizes && !conditions.specificSizes.includes(size)) return false;
      if (conditions.specificDays && !conditions.specificDays.includes(dayOfWeek)) return false;
      
      // Verificar time slots
      if (conditions.specificTimeSlots && conditions.specificTimeSlots.length > 0) {
        const inTimeSlot = conditions.specificTimeSlots.some(slot => 
          time >= slot.startTime && time <= slot.endTime
        );
        if (!inTimeSlot) return false;
      }
      
      // Verificar limite de usos
      if (conditions.maxUses && promo.usageCount >= conditions.maxUses) return false;
      
      return true;
    });
  },
  
  // Aplicar promoção ao preço
  applyPromotion(price, promotion) {
    if (!promotion) return price;
    
    switch (promotion.discountType) {
      case 'percentage':
        return price * (1 - promotion.discountValue / 100);
      case 'fixed':
        return Math.max(0, price - promotion.discountValue);
      case 'bogo':
        // Buy one get one - seria implementado no contexto de múltiplas reservas
        return price;
      default:
        return price;
    }
  },
  
  // Adicionar review
  async addReview(userId, gameId, reviewData) {
    // Verificar se já existe review deste user para este jogo
    const existingReview = this.reviews.find(r => 
      r.user.toString() === userId.toString() && 
      r.game && r.game.toString() === gameId.toString()
    );
    
    if (existingReview) {
      throw new Error('Já avaliaste este campo para este jogo');
    }
    
    // Verificar se o jogo foi realizado neste campo
    const Game = mongoose.model('Game');
    const game = await Game.findById(gameId);
    
    if (!game || game.field.toString() !== this._id.toString()) {
      throw new Error('Jogo não encontrado ou não foi realizado neste campo');
    }
    
    if (game.status !== 'completed') {
      throw new Error('Só podes avaliar após o jogo ter terminado');
    }
    
    // Verificar se o user participou no jogo
    const participated = game.players.confirmed.some(p => 
      p.user.toString() === userId.toString()
    );
    
    if (!participated) {
      throw new Error('Só jogadores que participaram podem avaliar');
    }
    
    // Adicionar review
    this.reviews.push({
      user: userId,
      game: gameId,
      verifiedBooking: true,
      ...reviewData
    });
    
    // Recalcular rating
    await this.updateRating();
    
    return this.save();
  },
  
  // Atualizar rating
  async updateRating() {
    if (this.reviews.length === 0) {
      this.rating = {
        average: 0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        aspects: {
          fieldQuality: { avg: 0, count: 0 },
          facilities: { avg: 0, count: 0 },
          accessibility: { avg: 0, count: 0 },
          valueForMoney: { avg: 0, count: 0 },
          staff: { avg: 0, count: 0 }
        },
        lastCalculated: new Date()
      };
      return;
    }
    
    // Filtrar apenas reviews visíveis
    const visibleReviews = this.reviews.filter(r => r.isVisible);
    
    if (visibleReviews.length === 0) {
      return;
    }
    
    // Calcular distribuição e média geral
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    const aspects = {
      fieldQuality: { total: 0, count: 0 },
      facilities: { total: 0, count: 0 },
      accessibility: { total: 0, count: 0 },
      valueForMoney: { total: 0, count: 0 },
      staff: { total: 0, count: 0 }
    };
    
    visibleReviews.forEach(review => {
      // Rating geral
      const rating = Math.round(review.rating.overall);
      distribution[rating]++;
      totalRating += review.rating.overall;
      
      // Ratings por aspecto
      Object.keys(aspects).forEach(aspect => {
        if (review.rating[aspect]) {
          aspects[aspect].total += review.rating[aspect];
          aspects[aspect].count++;
        }
      });
    });
    
    // Calcular médias
    const average = Math.round((totalRating / visibleReviews.length) * 10) / 10;
    
    const aspectAverages = {};
    Object.keys(aspects).forEach(aspect => {
      if (aspects[aspect].count > 0) {
        aspectAverages[aspect] = {
          avg: Math.round((aspects[aspect].total / aspects[aspect].count) * 10) / 10,
          count: aspects[aspect].count
        };
      } else {
        aspectAverages[aspect] = { avg: 0, count: 0 };
      }
    });
    
    this.rating = {
      average,
      count: visibleReviews.length,
      distribution,
      aspects: aspectAverages,
      lastCalculated: new Date()
    };
  },
  
  // Responder a review
  async respondToReview(reviewId, responseText, responderId) {
    const review = this.reviews.id(reviewId);
    
    if (!review) {
      throw new Error('Review não encontrada');
    }
    
    if (review.response && review.response.text) {
      throw new Error('Esta review já tem resposta');
    }
    
    // Verificar se o responder é admin/moderador do campo
    const isAdmin = this.management.admin.toString() === responderId.toString();
    const isModerator = this.management.moderators.some(m => 
      m.user.toString() === responderId.toString() && 
      m.permissions.includes('respond_reviews')
    );
    
    if (!isAdmin && !isModerator) {
      throw new Error('Sem permissões para responder a reviews');
    }
    
    review.response = {
      text: responseText,
      respondedBy: responderId,
      respondedAt: new Date()
    };
    
    return this.save();
  },
  
  // Gerar slug único
  generateSlug() {
    const baseSlug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const citySlug = this.location.city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');
    
    this.seo.slug = `${baseSlug}-${citySlug}`;
  },
  
  // Adicionar bloqueio
  async addBlockedSlot(startDateTime, endDateTime, reason, userId) {
    // Verificar permissões
    const isAdmin = this.management.admin.toString() === userId.toString();
    const isModerator = this.management.moderators.some(m => 
      m.user.toString() === userId.toString() && 
      m.permissions.includes('manage_availability')
    );
    
    if (!isAdmin && !isModerator) {
      throw new Error('Sem permissões para bloquear horários');
    }
    
    // Verificar conflitos com jogos existentes
    const Game = mongoose.model('Game');
    const conflictingGames = await Game.find({
      field: this._id,
      status: { $in: ['scheduled', 'confirmed'] },
      dateTime: { $gte: startDateTime, $lt: endDateTime }
    });
    
    if (conflictingGames.length > 0) {
      throw new Error(`Existem ${conflictingGames.length} jogos agendados neste período`);
    }
    
    this.availability.blockedSlots.push({
      startDateTime,
      endDateTime,
      reason,
      createdBy: userId
    });
    
    return this.save();
  },
  
  // Obter horários disponíveis para um dia
  async getAvailableSlots(date, duration = 90, size = '7v7') {
    const slots = [];
    const dayOfWeek = date.getDay();
    const schedule = this.availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule) return slots;
    
    // Converter horários para minutos
    const openMinutes = this.timeToMinutes(schedule.openTime);
    const closeMinutes = this.timeToMinutes(schedule.closeTime);
    const slotDuration = duration;
    
    // Gerar todos os slots possíveis
    for (let start = openMinutes; start + slotDuration <= closeMinutes; start += 30) {
      const startTime = new Date(date);
      startTime.setHours(Math.floor(start / 60), start % 60, 0, 0);
      
      const endTime = new Date(startTime.getTime() + slotDuration * 60000);
      
      // Verificar disponibilidade
      const availability = await this.isAvailable(startTime, slotDuration, size);
      
      if (availability.available) {
        const price = this.calculatePrice(size, startTime, slotDuration);
        
        slots.push({
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          available: true,
          price: price.finalPrice,
          promotion: price.promotion
        });
      }
    }
    
    return slots;
  },
  
  // Converter time string para minutos
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },
  
  // Atualizar estatísticas
  async updateStats() {
    const Game = mongoose.model('Game');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Total de bookings
    const totalBookings = await Game.countDocuments({
      field: this._id,
      status: { $in: ['completed', 'confirmed', 'scheduled'] }
    });
    
    // Bookings do mês atual
    const currentMonthBookings = await Game.countDocuments({
      field: this._id,
      dateTime: { $gte: startOfMonth },
      status: { $in: ['completed', 'confirmed', 'scheduled'] }
    });
    
    // Calcular taxa de cancelamento
    const cancelledGames = await Game.countDocuments({
      field: this._id,
      status: 'cancelled'
    });
    
    const cancellationRate = totalBookings > 0 
      ? (cancelledGames / (totalBookings + cancelledGames)) * 100 
      : 0;
    
    // Atualizar stats
    this.stats = {
      ...this.stats,
      totalBookings,
      currentMonthBookings,
      cancellationRate: Math.round(cancellationRate * 10) / 10
    };
    
    return this.save();
  },
  
  // Verificar se user pode editar
  canEdit(userId) {
    if (this.management.admin.toString() === userId.toString()) return true;
    
    return this.management.moderators.some(m => 
      m.user.toString() === userId.toString()
    );
  },
  
  // Obter disponibilidade semanal
  getWeeklySchedule() {
    const week = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return week.map((day, index) => {
      const schedule = this.availability.schedule.find(s => s.dayOfWeek === index);
      
      if (!schedule) {
        return {
          day,
          dayOfWeek: index,
          status: 'closed',
          hours: 'Fechado'
        };
      }
      
      return {
        day,
        dayOfWeek: index,
        status: 'open',
        hours: `${schedule.openTime} - ${schedule.closeTime}`,
        breakTime: schedule.breakTime 
          ? `Pausa: ${schedule.breakTime.start} - ${schedule.breakTime.end}` 
          : null
      };
    });
  }
};

// Hooks
fieldSchema.pre('save', function(next) {
  // Gerar slug se necessário
  if (this.isNew || this.isModified('name') || this.isModified('location.city')) {
    this.generateSlug();
  }
  
  // Garantir que há apenas uma imagem principal
  const mainImages = this.images.filter(img => img.isMain);
  if (mainImages.length > 1) {
    this.images.forEach((img, index) => {
      img.isMain = index === 0;
    });
  } else if (this.images.length > 0 && mainImages.length === 0) {
    this.images[0].isMain = true;
  }
  
  // Marcar como novo campo por 30 dias
  if (this.isNew) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    this.flags.new = true;
    
    // Agendar remoção da flag "new" (seria feito com cron job)
  }
  
  next();
});

// Hook para atualizar rating após save
fieldSchema.post('save', async function(doc) {
  if (this.isModified('reviews')) {
    await doc.updateRating();
  }
});

// Hook para limpar dados sensíveis quando campo é desativado
fieldSchema.pre('save', function(next) {
  if (this.isModified('isActive') && !this.isActive) {
    this.deactivatedAt = new Date();
  }
  next();
});

// Métodos estáticos
fieldSchema.statics = {
  // Procurar campos próximos
  async findNearby(coordinates, maxDistance = 10000, filters = {}) {
    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: maxDistance
        }
      },
      isActive: true
    };
    
    // Aplicar filtros
    if (filters.verified) query['verification.isVerified'] = true;
    if (filters.type) query['amenities.type'] = filters.type;
    if (filters.size) query['amenities.sizes.name'] = filters.size;
    if (filters.minRating) query['rating.average'] = { $gte: filters.minRating };
    if (filters.hasParking) query['amenities.parking.available'] = true;
    if (filters.hasShowers) query['amenities.changingRooms.showers'] = true;
    if (filters.maxPrice) {
      // Filtro de preço seria mais complexo
    }
    
    const fields = await this.find(query)
      .select('name location rating pricing amenities images seo.slug verification')
      .limit(filters.limit || 20);
    
    // Adicionar distância aos resultados
    return fields.map(field => {
      const distance = this.calculateDistance(
        coordinates,
        field.location.coordinates
      );
      
      return {
        ...field.toObject(),
        distance: Math.round(distance)
      };
    });
  },
  
  // Calcular distância entre coordenadas (Haversine formula)
  calculateDistance(coord1, coord2) {
    const R = 6371000; // Raio da Terra em metros
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distância em metros
  },
  
  // Campos populares
  async getPopular(limit = 10, city = null) {
    const query = {
      isActive: true,
      'verification.isVerified': true,
      'rating.count': { $gte: 5 } // Mínimo 5 reviews
    };
    
    if (city) query['location.city'] = city;
    
    return this.find(query)
      .sort('-rating.average -rating.count -stats.totalBookings')
      .limit(limit)
      .select('name location rating images amenities.type pricing seo.slug badges');
  },
  
  // Campos com promoções
  async getWithPromotions(city = null) {
    const now = new Date();
    const query = {
      isActive: true,
      'promotions.isActive': true,
      'promotions.validFrom': { $lte: now },
      'promotions.validUntil': { $gte: now }
    };
    
    if (city) query['location.city'] = city;
    
    return this.find(query)
      .select('name location promotions images rating pricing seo.slug')
      .limit(20);
  },
  
  // Campos destacados
  async getFeatured(limit = 6) {
    return this.find({
      isActive: true,
      'flags.featured': true,
      'verification.isVerified': true
    })
    .sort('-subscription.plan -rating.average')
    .limit(limit)
    .select('name location images rating amenities pricing seo.slug badges');
  },
  
  // Buscar por slug
  async findBySlug(slug) {
    return this.findOne({
      'seo.slug': slug,
      isActive: true
    }).populate('management.admin', 'name avatar')
      .populate('reviews.user', 'name avatar');
  },
  
  // Estatísticas globais
  async getGlobalStats() {
    const stats = await this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalFields: { $sum: 1 },
          verifiedFields: {
            $sum: { $cond: ['$verification.isVerified', 1, 0] }
          },
          avgRating: { $avg: '$rating.average' },
          totalBookings: { $sum: '$stats.totalBookings' },
          totalRevenue: { $sum: '$stats.totalRevenue' }
        }
      }
    ]);
    
    return stats[0] || {};
  }
};

const Field = mongoose.model('Field', fieldSchema);

module.exports = Field;