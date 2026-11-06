const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const Restaurante = require('../models/Restaurante');
const MenuItem = require('../models/MenuItem');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const { calcularDistanciaReal } = require('../services/osrm');

// 1. RUTA DEL DASHBOARD
router.get('/restaurante/dashboard', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const pedidosHoy = await Pedido.find({ restauranteId: restaurante._id, createdAt: { $gte: hoy } });
    let ventasTotales = 0, cobroEfectivo = 0, cobroTarjeta = 0, pedidosValidos = 0, tiempoTotal = 0;
    pedidosHoy.forEach(p => {
      if (p.estado !== 'cancelado') {
        ventasTotales += p.total; pedidosValidos++;
        if (p.pagado) {
          if (p.metodoPago === 'efectivo') cobroEfectivo += p.total;
          else cobroTarjeta += p.total;
        }
        if (p.estado === 'entregado' && p.tiempoEstimadoMin) tiempoTotal += p.tiempoEstimadoMin;
      }
    });
    res.json({
      ventasTotales: parseFloat(ventasTotales.toFixed(2)), cobroEfectivo: parseFloat(cobroEfectivo.toFixed(2)),
      cobroTarjeta: parseFloat(cobroTarjeta.toFixed(2)), pedidosHoy: pedidosValidos,
      ticketPromedio: pedidosValidos > 0 ? parseFloat((ventasTotales / pedidosValidos).toFixed(2)) : 0,
      tiempoPromedio: pedidosValidos > 0 ? Math.ceil(tiempoTotal / pedidosValidos) : 0
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. RUTA DE ESTADÍSTICAS
router.get('/restaurante/estadisticas', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const todosLosPedidos = await Pedido.find({ restauranteId: restaurante._id, estado: { $ne: 'cancelado' } });
    let ingresosTotales = 0; const conteoProductos = {};
    todosLosPedidos.forEach(p => {
      ingresosTotales += p.total;
      p.items.forEach(item => {
        if (!conteoProductos[item.nombre]) conteoProductos[item.nombre] = 0;
        conteoProductos[item.nombre] += item.cantidad;
      });
    });
    let platoEstrella = 'Ninguno'; let maxVentas = 0;
    for (const [nombre, cantidad] of Object.entries(conteoProductos)) {
      if (cantidad > maxVentas) { maxVentas = cantidad; platoEstrella = nombre; }
    }
    const ventasSemana = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(); fecha.setDate(fecha.getDate() - i); fecha.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fecha); fechaFin.setHours(23, 59, 59, 999);
      const pedidosDia = await Pedido.find({ restauranteId: restaurante._id, createdAt: { $gte: fecha, $lte: fechaFin }, estado: { $ne: 'cancelado' } });
      const totalDia = pedidosDia.reduce((sum, p) => sum + p.total, 0);
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      ventasSemana.push({ dia: dias[fecha.getDay()], total: parseFloat(totalDia.toFixed(2)) });
    }
    res.json({ ingresosTotales: parseFloat(ingresosTotales.toFixed(2)), totalPedidos: todosLosPedidos.length, platoEstrella, ventasSemana });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. RUTA PARA VER PEDIDOS ACTIVOS DEL COMERCIO
router.get('/restaurante', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const pedidos = await Pedido.find({ restauranteId: restaurante._id, estado: { $nin: ['entregado', 'cancelado'] } })
      .populate('clienteId', 'nombre telefono').sort({ createdAt: 1 });
    res.json(pedidos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. RUTA PARA VER PEDIDOS DESPACHADOS Y ENTREGADOS
router.get('/restaurante/despachados', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const pedidos = await Pedido.find({ restauranteId: restaurante._id, estado: { $in: ['en_camino', 'entregado'] } })
      .populate('clienteId', 'nombre telefono').populate('repartidorId', 'nombre').sort({ updatedAt: -1 });
    res.json(pedidos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. RUTA PARA VER PEDIDOS DEL CLIENTE
router.get('/', protegerRuta, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ clienteId: req.usuario.id })
      .populate('restauranteId', 'nombre').populate('repartidorId', 'nombre').sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 6. RUTA PARA VER ENTREGAS EN CURSO DEL REPARTIDOR
router.get('/repartidor/mis-entregas', protegerRuta, autorizarRoles('repartidor'), async (req, res) => {
  try {
    const pedidos = await Pedido.find({ repartidorId: req.usuario.id, estado: 'en_camino' }).populate('clienteId', 'nombre');
    res.json(pedidos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 7. RUTA PARA COBRAR
router.put('/:id/cobrar', protegerRuta, autorizarRoles('restaurante', 'admin'), async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estadoPago: 'pagado', pagado: true }, { new: true });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ success: true, pedido });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 8. RUTA PARA DESPACHAR
router.put('/:id/despachar', protegerRuta, autorizarRoles('restaurante', 'repartidor', 'admin'), async (req, res) => {
  try {
    const { estado } = req.body;
    let datosActualizar = { estado };
    if (estado === 'entregado') datosActualizar.fechaEntrega = new Date();
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, datosActualizar, { new: true });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ success: true, pedido });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 9. RUTA PARA CREAR PEDIDO
router.post('/', protegerRuta, autorizarRoles('cliente'), async (req, res) => {
  try {
    const { restauranteId, items, direccionEntrega, longitud, latitud } = req.body;
    const restaurante = await Restaurante.findById(restauranteId);
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    let subtotal = 0; const itemsGuardados = [];
    for (const item of items) {
      const producto = await MenuItem.findById(item.menuItemId);
      subtotal += (producto.precio * item.cantidad);
      itemsGuardados.push({ menuItemId: producto._id, nombre: producto.nombre, precio: producto.precio, cantidad: item.cantidad });
    }
    const [lngRest, latRest] = restaurante.ubicacion.coordinates;
    const { distanciaKm, duracionMin } = await calcularDistanciaReal(lngRest, latRest, parseFloat(longitud), parseFloat(latitud));
    const costoEnvio = 2.00 + (distanciaKm * 0.50);
    const total = subtotal + costoEnvio;
    const pinSeguridad = Math.floor(1000 + Math.random() * 9000).toString();

    const nuevoPedido = await Pedido.create({
      numeroOrden: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      clienteId: req.usuario.id, restauranteId: restaurante._id, items: itemsGuardados,
      subtotal, costoEnvio, total, direccionEntrega,
      ubicacionEntrega: { type: 'Point', coordinates: [parseFloat(longitud), parseFloat(latitud)] },
      distanciaKm, tiempoEstimadoMin: duracionMin, estado: 'pendiente',
      codigoSeguridad: pinSeguridad
    });
    res.status(201).json({ success: true, pedido: nuevoPedido });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 10. RUTA PARA OBTENER LA FACTURA DE UN PEDIDO (SOLO EL DUEÑO)
router.get('/:id/factura', protegerRuta, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    // Verificar que el pedido pertenezca al cliente
    if (pedido.clienteId.toString() !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta factura' });
    }

    if (!pedido.uuidFactura) {
      return res.status(404).json({ error: 'Este pedido aún no tiene factura electrónica' });
    }

    res.json({
      success: true,
      uuid: pedido.uuidFactura,
      pdf: pedido.pdfFactura,
      xml: pedido.xmlFactura
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;