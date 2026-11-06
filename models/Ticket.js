const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  numeroTicket: { type: String, unique: true },
  tipoUsuario: { type: String, enum: ['cliente', 'repartidor', 'comercio'], required: true },
  usuarioAfectado: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agenteAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  asunto: { type: String, required: true },
  descripcion: { type: String, required: true },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
  estado: { type: String, enum: ['abierto', 'en_proceso', 'resuelto', 'cerrado'], default: 'abierto' },
  
  // Auditoría: Registro de cada acción del agente
  historial: [{
    agente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accion: String,
    fecha: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
