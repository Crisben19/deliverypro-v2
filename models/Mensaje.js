const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
  emisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receptorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  texto: { type: String, required: true },
  leido: { type: Boolean, default: false }
}, { timestamps: true });

// Índice para buscar rápido los mensajes de un pedido
mensajeSchema.index({ pedidoId: 1, createdAt: 1 });

module.exports = mongoose.model('Mensaje', mensajeSchema);
