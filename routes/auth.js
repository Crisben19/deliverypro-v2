const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Resend } = require('resend'); 
const User = require('../models/User'); // Asegúrate de que esta ruta sea correcta

// Inicializamos Resend con la variable de entorno que guardamos en Render
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 4. Enviar el correo con Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'DeliveryPro <onboarding@resend.dev>',
        to: [email], // Enviamos al correo que se registró
        subject: '¡Bienvenido a DeliveryPro! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #FF5A5F; text-align: center;">¡Hola ${nombre}!</h1>
            <p style="font-size: 16px; color: #333;">Tu cuenta en DeliveryPro ha sido creada exitosamente.</p>
            <p style="font-size: 16px; color: #333;">Te has registrado con el rol de: <strong>${rol}</strong>.</p>
            <br>
            <p style="text-align: center; color: #999; font-size: 12px;">© 2025 DeliveryPro. Hecho en Guatemala.</p>
          </div>
        `
      });

      if (error) {
        console.error('Error de Resend:', error);
      } else {
        console.log('Correo enviado con ID:', data.id);
      }
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
    }

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