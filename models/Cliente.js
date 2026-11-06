const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  restauranteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
  nombre: { type: String, required: true },
  nit: { type: String, required: true },
  ciudad: { type: String, default: '' },
  direccion: { type: String, default: '' },
  telefono: { type: String, default: '' }
}, { timestamps: true });

// Índice para buscar rápido por NIT dentro de un restaurante
clienteSchema.index({ restauranteId: 1, nit: 1 }, { unique: true });

module.exports = mongoose.model('Cliente', clienteSchema);
