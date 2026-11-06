const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  rol: { 
    type: String, 
    enum: ['cliente', 'restaurante', 'repartidor', 'admin'], 
    default: 'cliente' 
  },
  telefono: String,
  direccion: String,
  fotoPerfil: { type: String, default: '' },
  
  // Solo para repartidores
  disponible: { type: Boolean, default: false },
  rating: { type: Number, default: 5 },
  vehiculo: { type: String, enum: ['moto', 'bicicleta', 'auto'], default: 'moto' },
  documentoVerificado: { type: Boolean, default: false },
  
  // Solo para restaurantes
  nombreLocal: String,
  categoria: String,
  logo: { type: String, default: '' },
  
  // Ubicación (para repartidores y restaurantes)
  ubicacion: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
}, { timestamps: true });

// Índice geoespacial para búsquedas por cercanía
userSchema.index({ ubicacion: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
