const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protegerRuta } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// @route   GET /api/users/perfil
// @desc    Obtener los datos del usuario logueado
router.get('/perfil', protegerRuta, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true, usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// @route   POST /api/users/foto-perfil
// @desc    Subir o actualizar foto de perfil
router.post('/foto-perfil', protegerRuta, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    // Guardamos la ruta de la imagen en la base de datos
    const rutaFoto = `/uploads/avatares/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.usuario.id, { fotoPerfil: rutaFoto });

    res.json({
      success: true,
      mensaje: 'Foto de perfil actualizada',
      fotoPerfil: rutaFoto
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir la foto', detalle: error.message });
  }
});

module.exports = router;
