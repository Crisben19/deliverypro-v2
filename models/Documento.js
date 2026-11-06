const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipo: { type: String, enum: ['licencia', 'identificacion', 'tarjeta_circulacion', 'foto_vehiculo'], required: true },
  archivoUrl: { type: String, required: true }, // Ruta de la imagen o PDF
  estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  motivoRechazo: { type: String, default: '' },
  revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // El admin que lo revisó
}, { timestamps: true });

module.exports = mongoose.model('Documento', documentoSchema);
