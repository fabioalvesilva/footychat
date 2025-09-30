const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Gerar JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Registar novo utilizador
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, phoneNumber, password, email } = req.body;
    
    // Validações
    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ 
        error: 'Nome, número de telemóvel e password são obrigatórios' 
      });
    }
    
    // Verificar se user já existe
    const existingUser = await User.findOne({ 
      $or: [{ phoneNumber }, { email: email || null }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Já existe um utilizador com este número ou email' 
      });
    }
    
    // Criar novo user
    const user = await User.create({
      name,
      phoneNumber,
      password,
      email,
      isVerified: true // Para o MVP, skip verification
    });
    
    // Gerar token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
      return res.status(400).json({ 
        error: 'Número e password são obrigatórios' 
      });
    }
    
    // Buscar user com password
    const user = await User.findOne({ phoneNumber }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();
    
    // Gerar token
    const token = generateToken(user._id);
    
    // Buscar grupos do user
    await user.populate('groups', 'name avatar');
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar,
        groups: user.groups
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('groups', 'name avatar memberCount');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};