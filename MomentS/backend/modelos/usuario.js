// Importa los paquetes necesarios
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Guarda el esquema de mongoose
const Schema = mongoose.Schema;

// Crea el esquema del usuario
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  followers: [{ type: mongoose.Types.ObjectId, required: true }],
  follows: [{ type: mongoose.Types.ObjectId, required: true }],
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place' }] // Conecta este modelo con el modelo Place
});

// Se encarga de que sólo puedas crear el usuario si pones un email que no exista
userSchema.plugin(uniqueValidator);

// Crea el modelo del sitio y lo exporta para poder usarlo desde otros archivos
module.exports = mongoose.model('User', userSchema);