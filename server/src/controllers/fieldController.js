const { Field } = require('../models');

// @desc    Listar campos próximos
// @route   GET /api/fields/nearby?lat=xxx&lng=xxx&radius=xxx
// @access  Public
exports.getNearbyFields = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude e longitude são obrigatórias' 
      });
    }
    
    const fields = await Field.findNearby(
      [parseFloat(lng), parseFloat(lat)],
      parseInt(radius),
      { verified: true }
    );
    
    res.json({
      success: true,
      count: fields.length,
      fields
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get campo específico
// @route   GET /api/fields/:id
// @access  Public
exports.getField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id)
      .populate('reviews.user', 'name avatar');
    
    if (!field) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }
    
    res.json({
      success: true,
      field
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Verificar disponibilidade
// @route   GET /api/fields/:id/availability?date=xxx&duration=xxx
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const { date, duration = 90, size = '7v7' } = req.query;
    
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }
    
    const slots = await field.getAvailableSlots(
      new Date(date),
      parseInt(duration),
      size
    );
    
    res.json({
      success: true,
      date,
      slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};