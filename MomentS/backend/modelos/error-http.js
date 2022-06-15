// Crea un error model

// Clase para manejar los errores de forma más personalizada
class HttpError extends Error {
  // Le llega el mensaje de error y el código de error
  constructor(message, errorCode) {
    super(message);
    this.code = errorCode;
  }
}

// Exporta la clase para poder usarla desde otros archivos
module.exports = HttpError;