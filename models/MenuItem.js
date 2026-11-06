const mongoose = require('mongoose');

// Esquema para los extras o modificadores (Ej: "Sin cebolla", "Extra queso")
const opcionSchema = new mongoose.Schema({
  nombre: { type: String, required: true }, // Ej: "Extra Queso"
  precioExtra: { type: Number, default: 0 } // Ej: 5.00 (si es gratis, es 0)
});

// Esquema para agrupar opciones (Ej: "Ingredientes", "Tamaño")
const grupoOpcionesSchema = new mongoose.Schema({
  nombreGrupo: { type: String, required: true }, // Ej: "Elige tus ingredientes"
  requerido: { type: Boolean, default: false }, // ¿Es obligatorio elegir uno?
  multiple: { type: Boolean, default: true },   // ¿Puede elegir varios? (Ej: varios ingredientes)
  opciones: [opcionSchema]
});

const menuItemSchema = new mongoose.Schema({
  restauranteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurante', required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  precio: { type: Number, required: true },
  imagen: { type: String, default: '' },
  
  // Categoría principal (Ej: "Hamburguesas", "Bebidas")
  categoria: { type: String, required: true }, 
  
  // Grupos de modificadores (Ej: "Ingredientes", "Extras")
  gruposOpciones: [grupoOpcionesSchema],
  
  disponible: { type: Boolean, default: true },
  stock: { type: Number, default: 100 }
}, { timestamps: true });

menuItemSchema.index({ restauranteId: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
