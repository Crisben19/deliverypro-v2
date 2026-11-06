const express = require('express');
const router = express.Router();
const Mensaje = require('../models/Mensaje');
const { protegerRuta } = require('../middlewares/auth');

// @route   GET /api/chats/:pedidoId
// @desc    Obtener el historial de mensajes de un pedido
router.get('/:pedidoId', protegerRuta, async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ pedidoId: req.params.pedidoId })
      .populate('emisorId', 'nombre rol')
      .sort({ createdAt: 1 });
    
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

module.exports = router;
