// Importa los paquetes necesarios
const mongoose = require('mongoose');

// Guarda el esquema de mongoose
const Schema = mongoose.Schema;

// Crea el esquema del sitio
const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' } // Conecta este modelo con el modelo User
});

// Crea el modelo del sitio y lo exporta para poder usarlo desde otros archivos
module.exports = mongoose.model('Place', placeSchema);