const express = require('express');
const router = express.Router();
const Restaurante = require('../models/Restaurante');
const { protegerRuta, autorizarRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/mio', protegerRuta, autorizarRoles('restaurante'), async (req, res) => {
  try {
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'No registrado' });
    res.json(restaurante);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', async (req, res) => {
  try {
    const restaurantes = await Restaurante.find().select('nombre descripcion categoria tipoComercio logo estado');
    res.json({ success: true, restaurantes });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', protegerRuta, autorizarRoles('restaurante'), upload.single('logo'), async (req, res) => {
  try {
    const { nombre, descripcion, categoria, telefono, direccion, longitud, latitud, tipoComercio } = req.body;
    const nuevo = await Restaurante.create({
      usuarioId: req.usuario.id, nombre, descripcion, categoria, telefono, direccion, tipoComercio: tipoComercio || 'Restaurante',
      logo: req.file ? `/uploads/restaurantes/${req.file.filename}` : '',
      ubicacion: { type: 'Point', coordinates: [parseFloat(longitud) || 0, parseFloat(latitud) || 0] }
    });
    res.status(201).json({ success: true, restaurante: nuevo });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/mio', protegerRuta, autorizarRoles('restaurante'), upload.single('logo'), async (req, res) => {
  try {
    const { nombre, categoria, telefono, direccion, descripcion, nit, razonSocial, direccionFiscal, tipoComercio, certificadorFEL, digifactUser, digifactPass } = req.body;
    
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (nombre) restaurante.nombre = nombre;
    if (categoria) restaurante.categoria = categoria;
    if (telefono) restaurante.telefono = telefono;
    if (direccion) restaurante.direccion = direccion;
    if (descripcion) restaurante.descripcion = descripcion;
    if (tipoComercio) restaurante.tipoComercio = tipoComercio;
    if (nit) restaurante.nit = nit;
    if (razonSocial) restaurante.razonSocial = razonSocial;
    if (direccionFiscal) restaurante.direccionFiscal = direccionFiscal;
    if (certificadorFEL) restaurante.certificadorFEL = certificadorFEL;
    if (digifactUser) restaurante.digifactUser = digifactUser;
    if (digifactPass) restaurante.digifactPass = digifactPass;

    if (req.file) restaurante.logo = `/uploads/restaurantes/${req.file.filename}`;

    if (restaurante.nit && restaurante.certificadorFEL && restaurante.digifactUser) {
      restaurante.felHabilitado = true;
    }

    await restaurante.save();
    res.json({ success: true, mensaje: 'Perfil actualizado', restaurante });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/firma-electronica', protegerRuta, autorizarRoles('restaurante'), upload.single('firma'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    
    const restaurante = await Restaurante.findOne({ usuarioId: req.usuario.id });
    if (!restaurante) return res.status(404).json({ error: 'Comercio no encontrado' });

    restaurante.firmaElectronica = `/uploads/firmas/${req.file.filename}`;
    await restaurante.save();

    res.json({ success: true, mensaje: 'Firma electrónica guardada', ruta: restaurante.firmaElectronica });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;