const express = require('express');
const router = express.Router();
const Inventario = require('../models/Inventario');
const Restaurante = require('../models/Restaurante');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');

// 1. GET: Obtener todo el inventario del comercio
router.get('/', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const inventario = await Inventario.find({ restauranteId: restaurante._id }).sort({ createdAt: -1 });
    res.json(inventario);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. GET: Obtener alertas de stock bajo (menos del mínimo)
router.get('/alertas', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    
    // Buscamos los productos donde el stock actual sea menor o igual al mínimo
    const alertas = await Inventario.find({ 
      restauranteId: restaurante._id,
      $expr: { $lte: ['$stockActual', '$stockMinimo'] },
      activo: true
    });
    res.json(alertas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. POST: Agregar un producto o insumo
router.post('/', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { nombreProducto, tipo, stockActual, stockMinimo, precioCompra, precioVenta, proveedor } = req.body;
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    const nuevoItem = await Inventario.create({
      restauranteId: restaurante._id, nombreProducto, tipo, stockActual, stockMinimo, precioCompra, precioVenta, proveedor,
      historial: [{ tipoMovimiento: 'ajuste', cantidad: stockActual, nota: 'Creación inicial' }]
    });
    res.status(201).json({ success: true, item: nuevoItem });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. PUT: Registrar compra/venta (actualiza stock)
router.put('/:id/movimiento', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { tipoMovimiento, cantidad, nota } = req.body;
    const item = await Inventario.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

    if (tipoMovimiento === 'compra') item.stockActual += parseInt(cantidad);
    else if (tipoMovimiento === 'venta') item.stockActual -= parseInt(cantidad);
    else if (tipoMovimiento === 'ajuste') item.stockActual = parseInt(cantidad);

    item.historial.push({ tipoMovimiento, cantidad: parseInt(cantidad), nota });
    await item.save();
    res.json({ success: true, item });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. PUT: Activar/Desactivar un producto
router.put('/:id/toggle', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const item = await Inventario.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    
    item.activo = !item.activo; // Cambia true a false o viceversa
    await item.save();
    res.json({ success: true, activo: item.activo });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
