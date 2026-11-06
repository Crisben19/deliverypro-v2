const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const { crearPago, verificarPago } = require('../services/paggo');

// @route   POST /api/pagos/crear
// @desc    Crear un link de pago para un pedido (Solo clientes)
router.post('/crear', protegerRuta, autorizarRoles('cliente'), async (req, res) => {
  try {
    const { pedidoId } = req.body;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.pagado) return res.status(400).json({ error: 'Este pedido ya está pagado' });

    const pago = await crearPago(pedido.total, `Pedido ${pedido.numeroOrden}`, pedido._id.toString());

    // Guardamos la referencia del pago en el pedido
    pedido.pagoId = pago.paymentId;
    pedido.metodoPago = 'paggo';
    await pedido.save();

    res.json({
      success: true,
      paymentUrl: pago.url,
      paymentId: pago.paymentId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el pago', detalle: error.message });
  }
});

// @route   POST /api/pagos/webhook
// @desc    Recibir confirmación de pago de Paggo
router.post('/webhook', async (req, res) => {
  try {
    const { payment_id, status, reference } = req.body;

    if (status === 'paid' && reference) {
      const pedido = await Pedido.findById(reference);
      if (pedido) {
        pedido.pagado = true;
        pedido.estadoPago = 'pagado';
        await pedido.save();
        console.log(`✅ Pago confirmado para pedido ${pedido.numeroOrden}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/pagos/verificar/:paymentId
// @desc    Verificar estado de un pago manualmente
router.get('/verificar/:paymentId', protegerRuta, async (req, res) => {
  try {
    const pago = await verificarPago(req.params.paymentId);
    res.json({ success: true, pago });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
