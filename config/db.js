const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    process.exit(1); // Detiene el servidor si no hay base de datos
  }
};

module.exports = conectarDB;
