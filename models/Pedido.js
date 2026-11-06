const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  numeroOrden: { type: String, unique: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restauranteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
  repartidorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    nombre: String,
    precio: Number,
    cantidad: Number
  }],
  
  subtotal: { type: Number, required: true },
  costoEnvio: { type: Number, required: true },
  total: { type: Number, required: true },
  
  direccionEntrega: { type: String, required: true },
  ubicacionEntrega: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  
  // Datos del cliente para facturación
  clienteNombre: { type: String, default: 'Cliente' },
  clienteNit: { type: String, default: 'C/F' },
  clienteCiudad: { type: String, default: '' },
  
  distanciaKm: { type: Number, required: true },
  tiempoEstimadoMin: { type: Number },
  
  tipoServicio: { type: String, enum: ['comida', 'mensajeria', 'delivery'], default: 'comida' },
  estado: { 
    type: String, 
    enum: ['pendiente', 'aceptado', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'], 
    default: 'pendiente' 
  },
  
  metodoPago: { type: String, enum: ['efectivo', 'paggo', 'tarjeta'], default: 'efectivo' },
  estadoPago: { type: String, enum: ['pendiente', 'pagado', 'fallido'], default: 'pendiente' },
  pagado: { type: Boolean, default: false },
  
  codigoSeguridad: { type: String, required: true },
  fechaEntrega: { type: Date },
  
  // ========== FACTURA ELECTRÓNICA (FEL) ==========
  uuidFactura: { type: String, default: '' },
  pdfFactura: { type: String, default: '' },
  xmlFactura: { type: String, default: '' },
  
  notas: { type: String, default: '' }
}, { timestamps: true });

pedidoSchema.index({ clienteId: 1, createdAt: -1 });
pedidoSchema.index({ restauranteId: 1, estado: 1 });
pedidoSchema.index({ repartidorId: 1, estado: 1 });

module.exports = mongoose.model('Pedido', pedidoSchema);
