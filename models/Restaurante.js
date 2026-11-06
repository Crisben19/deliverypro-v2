const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  tipoComercio: { 
    type: String, 
    enum: ['Restaurante', 'Farmacia', 'Supermercado', 'Floristería', 'Licorería', 'Otro'], 
    default: 'Restaurante' 
  },
  categoria: { type: String, required: true },
  integracionPropia: { type: Boolean, default: false },
  
  ubicacion: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  
  telefono: { type: String },
  direccion: { type: String, required: true },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  
  // ========== CONFIGURACIÓN FISCAL (FEL) ==========
  nit: { type: String, default: '' },
  razonSocial: { type: String, default: '' },
  direccionFiscal: { type: String, default: '' },
  
  certificadorFEL: { type: String, default: '' },
  firmaElectronica: { type: String, default: '' },
  passwordFirma: { type: String, default: '' },
  
  // Credenciales de Digifact
  digifactUser: { type: String, default: '' },
  digifactPass: { type: String, default: '' },
  
  felHabilitado: { type: Boolean, default: false },
  
  estado: { type: String, enum: ['abierto', 'cerrado'], default: 'cerrado' },
  verificado: { type: Boolean, default: false },
  
  rating: { type: Number, default: 0 },
  totalPedidos: { type: Number, default: 0 }
}, { timestamps: true });

restauranteSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model('Restaurante', restauranteSchema);