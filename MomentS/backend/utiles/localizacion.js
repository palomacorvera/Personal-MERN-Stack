// Importa los paquetes necesarios
const axios = require('axios');

// Importa la clase del error model
const HttpError = require('../modelos/error-http');

// API KEY de google maps platform
const API_KEY = 'AIzaSyDjdVQLhp8QYPuXH8xRYu7-fg2GgWM0f2g';

// Convierte un address en coordenadas automáticamente
async function getCoordsForAddress(address) {
  // encodeURIComponent convierte el address en un formato compatible con links
  // Manda una solicitud get al url y devuelve las coordenadas del address
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  // Saca los datos de la respuesta
  const data = response.data;

  // Comprueba que hay datos disponibles
  if (!data || data.status === 'ZERO_RESULTS') {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se ha encontrado localización para la dirección especificada.',
      422
    );
    throw error;
  }

  // Saca las coordenadas de los datos de la respuesta y los devuelve
  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

// Exporta la función anterior para poder usarla desde otros archivos
module.exports = getCoordsForAddress;