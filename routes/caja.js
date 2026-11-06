const express = require('express');
const router = express.Router();
const Caja = require('../models/Caja');
const Restaurante = require('../models/Restaurante');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const { facturarConDigifact } = require('../services/fel');

// 1. GET: Obtener todas las ventas
router.get('/', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });
    const ventas = await Caja.find({ restauranteId: restaurante._id }).sort({ createdAt: -1 });
    res.json(ventas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. POST: Facturar una venta
router.post('/facturar', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { ventaId, clienteNombre, clienteNit, clienteCiudad, clienteDireccion, items, metodoPago } = req.body;
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal;
    const numeroFactura = 'FAC-' + Math.floor(1000 + Math.random() * 9000);

    // Crear la venta en la base de datos
    const nuevaVenta = await Caja.create({
      restauranteId: restaurante._id,
      numeroFactura,
      clienteNombre: clienteNombre || 'Cliente de Mostrador',
      clienteNit: clienteNit || 'C/F',
      clienteCiudad: clienteCiudad || '',
      clienteDireccion: clienteDireccion || '',
      items, subtotal, total, metodoPago
    });

    // Guardar el cliente si no existe (para próximas compras)
    if (clienteNit && clienteNit !== 'C/F') {
      const existe = await Cliente.findOne({ restauranteId: restaurante._id, nit: clienteNit });
      if (!existe) {
        await Cliente.create({
          restauranteId: restaurante._id,
          nombre: clienteNombre,
          nit: clienteNit,
          ciudad: clienteCiudad,
          direccion: clienteDireccion
        });
      }
    }

    // ========== FACTURACIÓN FEL ==========
    let facturaFEL = null;
    if (restaurante.felHabilitado) {
      const ventaParaFEL = {
        items: items.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
        clienteNit: clienteNit || 'CF',
        clienteNombre: clienteNombre || 'Consumidor Final',
        total: total
      };
      
      facturaFEL = await facturarConDigifact(restaurante, ventaParaFEL);

      if (facturaFEL.success) {
        nuevaVenta.uuidFactura = facturaFEL.authNumber;
        await nuevaVenta.save();
        
        // Guardar la factura en el pedido si existe (venta de mostrador con pedido)
        if (ventaId) {
          try {
            await Pedido.findByIdAndUpdate(ventaId, {
              uuidFactura: facturaFEL.authNumber,
              pdfFactura: facturaFEL.pdf,
              xmlFactura: facturaFEL.xml
            });
          } catch (e) { console.error('Error al guardar factura en pedido:', e); }
        }
      } else {
        console.error('Error al facturar con FEL:', facturaFEL.error);
      }
    }

    res.status(201).json({ 
      success: true, 
      venta: nuevaVenta,
      facturaFEL: facturaFEL
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. POST: Solicitar delivery express
router.post('/delivery-express', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { ventaId } = req.body;
    const venta = await Caja.findById(ventaId);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

    const repartidor = await User.findOne({ rol: 'repartidor', disponible: true });
    if (!repartidor) return res.status(400).json({ error: 'No hay repartidores disponibles' });

    venta.repartidorAsignado = repartidor._id;
    await venta.save();
    res.json({ success: true, mensaje: 'Repartidor asignado', repartidor: repartidor.nombre });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. GET: Obtener reporte de ventas por rango de fechas
router.get('/reportes', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    const filtro = {
      restauranteId: restaurante._id,
      createdAt: { $gte: new Date(desde), $lte: new Date(hasta) }
    };

    const ventas = await Caja.find(filtro);
    const totalEfectivo = ventas.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
    const totalTarjeta = ventas.filter(v => v.metodoPago === 'tarjeta').reduce((sum, v) => sum + v.total, 0);

    res.json({
      totalVentas: ventas.length,
      totalEfectivo: totalEfectivo.toFixed(2),
      totalTarjeta: totalTarjeta.toFixed(2),
      totalGeneral: (totalEfectivo + totalTarjeta).toFixed(2),
      ventas
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. POST: Realizar arqueo de caja
router.post('/arqueo', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoy = await Caja.find({ restauranteId: restaurante._id, createdAt: { $gte: hoy } });
    const totalEfectivo = ventasHoy.filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0);
    const totalTarjeta = ventasHoy.filter(v => v.metodoPago === 'tarjeta').reduce((sum, v) => sum + v.total, 0);
    const totalGeneral = totalEfectivo + totalTarjeta;

    res.json({
      arqueo: {
        fecha: new Date().toISOString(),
        totalEfectivo: totalEfectivo.toFixed(2),
        totalTarjeta: totalTarjeta.toFixed(2),
        totalGeneral: totalGeneral.toFixed(2),
        totalVentas: ventasHoy.length
      }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;