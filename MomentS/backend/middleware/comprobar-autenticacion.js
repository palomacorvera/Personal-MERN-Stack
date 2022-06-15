// Importa los paquetes necesarios
const jwt = require('jsonwebtoken');

// Importa los documentos necesarios
const HttpError = require('../modelos/error-http');

// Middleware que se encarga de verificar que las solicitudes que llegan van con un token válido (indicando que el usuario que manda la solicitud está iniciado sesión)
// Exporta el middleware para poder usarlo desde otros archivos
module.exports = (req, res, next) => {
  // Hago esto para ignorar una acción automatica del navegador, que manda una solicitud OPTIONS antes de la que quiero para ver si tiene permitido hacer la solicitud POST
  if (req.method === 'OPTIONS') {
    return next();
  };

  try {
    // Obtiene el token del header de la solicitud
    const token = req.headers.authorization.split(' ')[1]; // Hago el split porque el token llega como Authorization: 'Bear TOKEN'
    
    // Entra si no hay un token
    if (!token) {
      throw new Error('Autenticación fallida!');
    };

    // Verifica que el token introducido coincide con la clave privada y es válido
    const decodedToken = jwt.verify(token, 'supersecret_dont_share');
    // Añado a la solicitud el id del usuario guardado en el token
    req.userData = { userId: decodedToken.userId };

    // Indico a la solicitud que continue su proceso
    next();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError('Autenticación fallida!', 403);
    return next(error);
  }
};
