const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Restaurante = require('../models/Restaurante');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 1. GET: Obtener el menú del restaurante logueado
router.get('/mio', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });
    
    const items = await MenuItem.find({ restauranteId: restaurante._id });
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. GET: Ver el menú de un restaurante específico (Para clientes)
router.get('/restaurante/:id', async (req, res) => {
  try {
    const items = await MenuItem.find({ restauranteId: req.params.id, disponible: true });
    res.json(items);
  } catch (error) { 
    res.status(500).json({ error: 'Error al cargar el menú', detalle: error.message }); 
  }
});

// 3. POST: Agregar un producto con imagen
router.post('/', protegerRuta, autorizarRoles('restaurante'), upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria } = req.body;
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'No tienes un restaurante registrado' });

    let imagenUrl = req.file ? `/uploads/menus/${req.file.filename}` : '';
    
    // Si el cliente envía grupos de opciones (extras), los procesamos
    let opcionesParseadas = [];
    if (req.body.gruposOpciones) {
      try { opcionesParseadas = JSON.parse(req.body.gruposOpciones); } catch (e) {}
    }

    const nuevoItem = await MenuItem.create({
      restauranteId: restaurante._id, 
      nombre, 
      descripcion,
      precio: parseFloat(precio), 
      categoria, 
      imagen: imagenUrl, 
      gruposOpciones: opcionesParseadas
    });
    
    res.status(201).json({ success: true, item: nuevoItem });
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

module.exports = router;