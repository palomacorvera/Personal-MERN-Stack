//Importo los paquetes necesarios
const multer = require('multer');
const uuid = require('uuid/v1');

// Array para controlar la extensión de la imagen
const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

// Middleware que proporciona multer, lo modifico para que se adapte a mis necesidades al coger imagenes
const fileUpload = multer({
  // Indica el límite de peso del archivo
  limits: 500000,
  // Indica los datos de almacenamiento del archivo
  storage: multer.diskStorage({
    // Crea el destino donde debe guardarse el archivo
    destination: (req, file, cb) => {
      // Llamo la función del callback y le paso null (no hay errores) y un path donde quiero que se guarde la imagen
      cb(null, 'uploads/images');
    },
    // Crea el nombre del archivo
    filename: (req, file, cb) => {
      // Guarda la extensión de la imagen usando el array para saber cuál es
      const ext = MIME_TYPE_MAP[file.mimetype];

      // Llamo la función del callback y le paso null (no hay errores) y un id único generado por uuid
      // Genera un file aleatorio con la extensión necesaria
      cb(null, uuid() + '.' + ext);
    }
  }),
  // Indico que solo debe coger images válidas
  fileFilter: (req, file, cb) => {
    // Variable que indica si la imagen es válida o no
    const isValid = !!MIME_TYPE_MAP[file.mimetype]; // Los !! convierten un undefined o null en false y una respuesta en true

    // Guardo el error como null si el tipo de imagen es válida, y como un nuevo error si no
    let error = isValid ? null : new Error('Formato no válido!');

    // Llamo la función del callback y le el error y si acepta la imagen o no
    cb(error, isValid);
  }
});

// Exporta el middleware para poder usarlo desde otros archivos
module.exports = fileUpload;