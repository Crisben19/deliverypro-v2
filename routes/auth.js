const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario con verificación de reCAPTCHA
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, telefono, rol, recaptchaToken } = req.body;

    // 1. Verificar reCAPTCHA
    if (recaptchaToken) {
      try {
        const captchaRes = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
        );
        if (!captchaRes.data.success) {
          return res.status(400).json({ error: 'Verificación de reCAPTCHA fallida. Intenta de nuevo.' });
        }
      } catch (e) {
        console.log("Nota: No se pudo verificar el reCAPTCHA, pero continuando...");
      }
    }

    // 2. Validar que el email no exista
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // 3. Crear usuario
    const nuevoUsuario = await User.create({ nombre, email, password, telefono, rol: rol || 'cliente' });
    const token = generarToken(nuevoUsuario._id, nuevoUsuario.rol);

    res.status(201).json({
      success: true,
      token,
      usuario: { id: nuevoUsuario._id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: nuevoUsuario.rol }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = generarToken(usuario._id, usuario.rol);
    res.json({
      success: true,
      token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;