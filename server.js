require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const conectarDB = require('./config/db');

conectarDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// CONFIGURACIÓN DE WEBSOCKETS
// ==========================================
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado al chat:', socket.id);

  // Unirse a la sala de un pedido específico
  socket.on('unirse:chat', (pedidoId) => {
    socket.join(`chat:${pedidoId}`);
    console.log(`👤 Usuario unido al chat del pedido ${pedidoId}`);
  });

  // Recibir un mensaje y reenviarlo a la sala
  socket.on('enviar:mensaje', async (data) => {
    try {
      const Mensaje = require('./models/Mensaje');
      const nuevoMensaje = await Mensaje.create(data);
      io.to(`chat:${data.pedidoId}`).emit('nuevo:mensaje', nuevoMensaje);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
    }
  });

  // Chat de Soporte (Call Center)
  socket.on('mensaje:soporte', async (data) => {
    try {
      io.emit('nuevo:mensaje:soporte', data);
      const Mensaje = require('./models/Mensaje');
      await Mensaje.create({
        pedidoId: null,
        emisorId: data.emisorId,
        receptorId: null,
        texto: `[${data.emisorRol.toUpperCase()}] ${data.emisorNombre}: ${data.texto}`,
        leido: false
      });
    } catch (error) {
      console.error('Error al procesar mensaje de soporte:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado del chat');
  });
});

// ==========================================
// IMPORTAR RUTAS
// ==========================================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const documentoRoutes = require('./routes/documentos');
const restauranteRoutes = require('./routes/restaurantes');
const menuRoutes = require('./routes/menu');
const pedidoRoutes = require('./routes/pedidos');
const repartidorRoutes = require('./routes/repartidores');
const pagosRoutes = require('./routes/pagos');
const chatRoutes = require('./routes/chats');
const inventarioRoutes = require('./routes/inventario');
const cajaRoutes = require('./routes/caja');
const clientesRoutes = require('./routes/clientes');

// ==========================================
// USAR RUTAS
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/repartidores', repartidorRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/clientes', clientesRoutes);

// ==========================================
// RUTA DE PRUEBA
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor DeliveryPro v2.0 funcionando 🚀' });
});

// ==========================================
// ARRANCAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});