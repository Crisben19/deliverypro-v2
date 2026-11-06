const mongoose = require('mongoose');

const inventarioSchema = new mongoose.Schema({
  restauranteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
  nombreProducto: { type: String, required: true },
  tipo: { type: String, enum: ['producto_venta', 'insumo'], default: 'producto_venta' },
  stockActual: { type: Number, required: true, default: 0 },
  stockMinimo: { type: Number, default: 5 },
  precioCompra: { type: Number, default: 0 },
  precioVenta: { type: Number, default: 0 },
  proveedor: { type: String, default: '' },
  
  // NUEVO: Para poder pausar productos
  activo: { type: Boolean, default: true },
  
  historial: [{
    tipoMovimiento: { type: String, enum: ['compra', 'venta', 'ajuste'] },
    cantidad: Number,
    fecha: { type: Date, default: Date.now },
    nota: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Inventario', inventarioSchema);
