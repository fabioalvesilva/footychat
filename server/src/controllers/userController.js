const { User, Notification } = require('../models');

// @desc    Get perfil do user
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationCode');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update perfil
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, location },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get notificações
// @route   GET /api/users/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getUnread(req.user._id);
    
    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Marcar notificação como lida
// @route   PUT /api/users/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }
    
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    await notification.markAsRead();
    
    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};