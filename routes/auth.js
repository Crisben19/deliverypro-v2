const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Asegúrate de que esta ruta sea correcta para tu modelo

// ==========================================
// CONFIGURACIÓN DE NODEMAILER (GMAIL)
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bencri2019@gmail.com', // Tu correo configurado
    pass: 'focl lsiy ymsu jycq'   // Tu contraseña de aplicación
  }
});

// ==========================================
// RUTA DE REGISTRO
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, telefono, password, rol } = req.body;

    // 1. Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ mensaje: 'Este correo ya está registrado.' });
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear el usuario en MongoDB
    const newUser = new User({
      nombre,
      email,
      telefono,
      password: hashedPassword,
      rol
    });

    await newUser.save();

    // 4. Enviar el correo de bienvenida
    const mailOptions = {
      from: '"DeliveryPro" <bencri2019@gmail.com>',
      to: email,
      subject: '¡Bienvenido a DeliveryPro! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #FF5A5F; text-align: center;">¡Hola ${nombre}!</h1>
          <p style="font-size: 16px; color: #333;">Tu cuenta en DeliveryPro ha sido creada exitosamente.</p>
          <p style="font-size: 16px; color: #333;">Te has registrado con el rol de: <strong>${rol}</strong>.</p>
          <p style="font-size: 16px; color: #333;">Pronto recibirás más novedades y actualizaciones sobre el servicio.</p>
          <br>
          <p style="text-align: center; color: #999; font-size: 12px;">© 2025 DeliveryPro. Hecho en Guatemala.</p>
        </div>
      `
    };

    // Enviamos el correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
      } else {
        console.log('Correo enviado:', info.response);
      }
    });

    // 5. Responder al frontend
    res.status(201).json({ mensaje: 'Usuario registrado con éxito. Revisa tu correo.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al registrar.' });
  }
});

// ==========================================
// RUTA DE LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ mensaje: 'Credenciales inválidas.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ mensaje: 'Credenciales inválidas.' });

    res.json({ mensaje: 'Login exitoso', rol: user.rol, nombre: user.nombre });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  }
});

module.exports = router;