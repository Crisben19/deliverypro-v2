const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
  restauranteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
  numeroFactura: { type: String, unique: true },
  
  clienteNombre: { type: String, default: 'Cliente de Mostrador' },
  clienteNit: { type: String, default: 'C/F' },
  clienteCiudad: { type: String, default: '' },
  clienteDireccion: { type: String, default: '' },
  
  items: [{
    nombre: String,
    precio: Number,
    cantidad: Number
  }],
  
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta'], default: 'efectivo' },
  
  estado: { type: String, enum: ['pagado', 'pendiente'], default: 'pagado' },
  repartidorAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // UUID de la factura electrónica (FEL)
  uuidFactura: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Caja', cajaSchema);