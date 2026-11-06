const multer = require('multer');
const path = require('path');

// Configuración de dónde y cómo se guardan los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determinamos la carpeta según el campo que se envíe
    let carpeta = 'public/uploads/';
    if (req.baseUrl.includes('documentos')) carpeta += 'documentos';
    else if (req.baseUrl.includes('menu')) carpeta += 'menus';
    else if (req.baseUrl.includes('restaurantes')) carpeta += 'restaurantes';
    else carpeta += 'avatares';

    cb(null, carpeta);
  },
  filename: function (req, file, cb) {
    // Renombramos el archivo para que no se repita: campo-fecha.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = /jpeg|jpg|png|webp|pdf/;
  const extname = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimetype = tiposPermitidos.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp) y PDFs'));
  }
};

// Exportamos la configuración con un límite de 5MB por archivo
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter
});

module.exports = upload;
