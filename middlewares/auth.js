const jwt = require('jsonwebtoken');

// 1. Verifica que el usuario esté logueado (tenga un token válido)
const protegerRuta = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded; // Guardamos los datos del usuario en la petición
      next();
    } catch (error) {
      res.status(401).json({ error: 'No autorizado, token inválido o expirado' });
    }
  } else {
    res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};

// 2. Verifica que el usuario tenga el rol correcto (ej: solo admin o restaurante)
const autorizarRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: `El rol ${req.usuario.rol} no tiene permiso para acceder a esta ruta` 
      });
    }
    next();
  };
};

module.exports = { protegerRuta, autorizarRoles };
