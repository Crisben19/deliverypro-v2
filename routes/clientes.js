const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Restaurante = require('../models/Restaurante');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');

// 1. GET: Buscar cliente por NIT
router.get('/buscar/:nit', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    const cliente = await Cliente.findOne({ restauranteId: restaurante._id, nit: req.params.nit });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    res.json({ success: true, cliente });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. POST: Guardar nuevo cliente
router.post('/', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { nombre, nit, ciudad, direccion, telefono } = req.body;
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    // Verificar si ya existe el NIT
    const existe = await Cliente.findOne({ restauranteId: restaurante._id, nit });
    if (existe) return res.status(400).json({ error: 'El NIT ya está registrado para este comercio' });

    const nuevoCliente = await Cliente.create({
      restauranteId: restaurante._id, nombre, nit, ciudad, direccion, telefono
    });
    res.status(201).json({ success: true, cliente: nuevoCliente });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
