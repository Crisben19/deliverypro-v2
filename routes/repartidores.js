const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');

// @route   GET /api/repartidores/pedidos-pendientes
// @desc    Ver pedidos que están pendientes y no tienen repartidor asignado
router.get('/pedidos-pendientes', protegerRuta, autorizarRoles('repartidor'), async (req, res) => {
  try {
    const pedidos = await Pedido.find({ estado: 'pendiente', repartidorId: null })
      .populate('restauranteId', 'nombre direccion')
      .populate('clienteId', 'nombre telefono');
    res.json({ success: true, pedidos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos pendientes' });
  }
});

// @route   PUT /api/repartidores/aceptar/:id
// @desc    Aceptar un pedido para repartir
router.put('/aceptar/:id', protegerRuta, autorizarRoles('repartidor'), async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Este pedido ya fue tomado por otro repartidor' });
    }

    pedido.repartidorId = req.usuario.id;
    pedido.estado = 'aceptado';
    await pedido.save();

    res.json({ success: true, mensaje: 'Pedido aceptado correctamente. ¡Ve a recogerlo!', pedido });
  } catch (error) {
    res.status(500).json({ error: 'Error al aceptar el pedido', detalle: error.message });
  }
});

module.exports = router;