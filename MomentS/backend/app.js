// Importa los paquetes necesarios
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Recupera los middleware exportados con las rutas
const placesRoutes = require('./rutas/rutas-lugares');
const usersRoutes = require('./rutas/rutas-usuarios');

// Importa la clase del error model
const HttpError = require('./modelos/error-http');

// Crea el objeto app ejecutando express como una función
const app = express();

// Analiza el body de las solicitudes entrantes, 
// convierte el json que encuentre en estructuras de datos de JavaScript, 
// y llama next() para que siga a la siguiente middleware
app.use(bodyParser.json());

// Middleware para acceder a la imagen guardada desde el formulario
// express.static() lo proporciona express, y es una middleware que devuelve el archivo solicitado entre paréntesis
// path.join crea una ruta con las carpetas proporcionadas entre paréntesis
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// Middleware para solucionar los cors errors de seguridad que da chrome por tener que usar puestos diferentes en el front y en el back
app.use((req, res, next) => {
  // Añade headers a todas las respuestas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  // Sigue a las siguientes middlewares
  next();
});

// Middleware que recupera las rutas exportadas desde places-routes.js
app.use('/api/places', placesRoutes);
// Middleware que recupera las rutas exportadas desde users-routes.js
app.use('/api/users', usersRoutes);

// Sólo se ejecuta si una de las rutas del middleware anterior no devuelve una respuesta
app.use((req, res, next) => {
  // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// Middleware de manejo de errores (se ejecuta si algún middleware anterior a él devuelve un error)
app.use((error, req, res, next) => {
  // Entra si hay una imagen
  if (req.file) {
    // Si hay una imagen y llegamos aquí significa que hay un error, por lo que queremos eliminar la imagen guardada
    // Le paso a la función la imagen que quiero borrar, y una función de callback que se ejecutará al terminar
    fs.unlink(req.file.path, err => {
      // Al terminar muestra por consola los posibles errores
      console.log(err);
    });
  };

  // Se ejecuta si ya se ha devuelto una respuesta
  if (res.headerSent) {
    // Devuelve el error que le llega
    return next(error);
  };

  // Continua si no se ha devuelto una respuesta aún
  // Indica el tipo de error, si se ha especificado, y error 500 si no
  res.status(error.code || 500);
  // Devuelve el mensaje de error en formato json si se ha especificado, y un error predefinido si no
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// Conecta con el servidor
mongoose
  .connect(
    `mongodb+srv://paloma:abc@cluster0.c5lod.mongodb.net/mern?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    // Escucha el puerto 3001
    app.listen(3001);
  })
  .catch(err => {
    console.log(err);
  });