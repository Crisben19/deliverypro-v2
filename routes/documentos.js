const express = require('express');
const router = express.Router();
const Documento = require('../models/Documento');
const User = require('../models/User');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// @route   POST /api/documentos/subir
// @desc    Subir un documento (Solo repartidores)
router.post('/subir', protegerRuta, autorizarRoles('repartidor'), upload.single('documento'), async (req, res) => {
  try {
    const { tipo } = req.body; 
    // tipo debe ser: 'licencia', 'identificacion', 'tarjeta_circulacion' o 'foto_vehiculo'

    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún documento' });
    }

    if (!tipo) {
      return res.status(400).json({ error: 'Debes especificar el tipo de documento' });
    }

    const rutaDocumento = `/uploads/documentos/${req.file.filename}`;

    // Guardar en la base de datos
    const nuevoDocumento = await Documento.create({
      usuarioId: req.usuario.id,
      tipo,
      archivoUrl: rutaDocumento,
      estado: 'pendiente'
    });

    res.status(201).json({
      success: true,
      mensaje: 'Documento subido correctamente, esperando verificación del administrador',
      documento: nuevoDocumento
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir documento', detalle: error.message });
  }
});

module.exports = router;
