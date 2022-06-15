// Middleware functions que se ejecutan al llegar a cada ruta

// Importa los paquetes necesarios
const fs = require('fs');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Importa la clase del error model
const HttpError = require('../modelos/error-http');
//Importa la función de conversión de address a coordenadas
const getCoordsForAddress = require('../utiles/localizacion');

// Importa el modelo del sitio
const Place = require('../modelos/lugar');
// Importa el modelo del usuario
const User = require('../modelos/usuario');

// Middleware function que se ejecuta cuando con la ruta se buscan todos los sitios de la base de datos
const getPlaces = async (req, res, next) => {
  let places;

  try {
    // Busca en los documentos creados con el modelo
    // (No devuelve una promise real)
    places = await Place.find();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Error al obtener los lugares, inténtalo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Devuelve toda su información en formato json
  // Convierto el objeto de mongoose en un objeto javascript con .toObject()
  // Quito el _ del id con getters:true
  res.json({ places: places.map(place => place.toObject({ getters: true })) });
};

// Middleware function que se ejecuta cuando con la ruta se busca un sitio mediante su id
const getPlaceById = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const placeId = req.params.pid;

  let place;

  try {
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    place = await Place.findById(placeId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no pudo encontrar ningún lugar.',
      500
    );
    return next(error);
  };

  // Entra si no encuentra el id en el array
  if (!place) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo encontrar el lugar para el id proporcionado.',
      404
    );
    return next(error);
  };

  // Si encuentra el id en el array, devuelve toda su información en formato json
  // Convierto el objeto de mongoose en un objeto javascript con .toObject()
  // Quito el _ del id con getters:true
  res.json({ place: place.toObject({ getters: true }) });
};

// Middleware function que se ejecuta cuando con la ruta se busca un sitio mediante el id del usuario
const getPlacesByUserId = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const userId = req.params.uid;

  let userWithPlaces;

  try {
    // find() lo da mongoose y convierte todo lo creado con el modelo en un array
    // Poniendo entre paréntesis el parámetro, filtro entre los resultados
    // (aquí uso find() en lugar de findById() porque puede haber varios sitios de un mismo usuario)
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Error al obtener los lugares, inténtalo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Entra si no encuentra el id en el array
  if (!userWithPlaces) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
    return next(
      new HttpError('No se pudieron encontrar lugares para el id de usuario proporcionado.', 404)
    );
  };

  // Si encuentra el id en el array, devuelve toda su información en formato json
  // Convierto el objeto de mongoose en un objeto javascript con .toObject()
  // Quito el _ del id con getters:true
  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    )
  });
};

// Middleware function que se ejecuta cuando se quiere crear un place nuevo
const createPlace = async (req, res, next) => {
  // Comprueba si hay errores de validación siguiendo las pautas indicadas en places-routes.js
  const errors = validationResult(req);

  // Entra si hay errores
  if (!errors.isEmpty()) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    return next(
      new HttpError('Entradas no válidas, por favor verifique sus datos.', 422)
    );
  };

  // Guarda la información que le llega desde el body
  const { title, description, address } = req.body;

  // Llama a la función para convertir el address en coordenadas y recoge el error, si existiese
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  };

  // Crea el nuevo place con el modelo creado
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,  // Le paso la imagen guardada en los archivos (que viene del formulario también)
    creator: req.userData.userId
  });

  let user;
  try {
    // Comprueba si el id del usuario ya está registrado
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    user = await User.findById(req.userData.userId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo crear el lugar, inténtalo de nuevo.',
      500
    );
    return next(error);
  };

  if (!user) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError('No se pudo encontrar el usuario para el id proporcionado.', 404);
    return next(error);
  }

  try {
    // Esta sesión nos permite empezar nuestra transacción
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // save() lo da mongoose y funciona junto a los models
    // Añade el producto en la base de datos especificada en los credenciales, la colección es el primer argumento al crear el modelo 
    await createdPlace.save({ session: sess });

    // Añade el id del sitio al usuario
    // push() es de mongoose y establece la conexión entre los dos modelos (user y place)
    // coge el id de place y lo guarda a los places del user
    user.places.push(createdPlace);

    // Guarda el sitio actualizado
    await user.save({ session: sess });

    // Sólo se guarda la información si ambos saves van bien
    await sess.commitTransaction();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo crear el lugar, inténtalo de nuevo.',
      500
    );
    return next(error);
  };

  // Devuelve un estado de 201 (significa que algo se ha creado correctamente) y el place creado
  res.status(201).json({ place: createdPlace });
};

// Middleware function que se ejecuta cuando se modificar un place mediante su id
const updatePlace = async (req, res, next) => {
  // Comprueba si hay errores de validación siguiendo las pautas indicadas en places-routes.js
  const errors = validationResult(req);

  // Entra si hay errores
  if (!errors.isEmpty()) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    return next(
      new HttpError('Entradas no válidas, por favor verifique sus datos.', 422)
    );
  };

  // Guarda la información que le llega desde el body (al patch también le llega información en el body)
  const { title, description } = req.body;
  // Recupera de la ruta el id dinámico
  const placeId = req.params.pid;

  let place;

  try {
    // find() lo da mongoose y convierte todo lo creado con el modelo en un array
    // Poniendo entre paréntesis el parámetro, filtro entre los resultados
    // (aquí uso find() en lugar de findById() porque puede haber varios sitios de un mismo usuario)
    place = await Place.findById(placeId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no se pudo actualizar el lugar.',
      500
    );
    return next(error);
  };

  // Compruebo si el usuario que manda la solicitud de modificar el sitio es el mismo que lo ha creado
  // Uso el toString porque place.creator es un objeto de mongoose y el userId es un string
  if (place.creator.toString() !== req.userData.userId) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError('No tienes permiso para editar este lugar.', 401);
    return next(error);
  };

  // Modifica los datos del place recuperado de la base de datos
  place.title = title;
  place.description = description;

  try {
    // save() lo da mongoose y funciona junto a los models
    // Guarda el producto en la base de datos especificada en los credenciales, la colección es el primer argumento al crear el modelo 
    await place.save();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no se pudo actualizar el lugar.',
      500
    );
    return next(error);
  };

  // Devuelve una respuesta de éxito, y el place modificado
  // Convierto el objeto de mongoose en un objeto javascript con .toObject()
  // Quito el _ del id con getters:true
  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// Middleware function que se ejecuta cuando se eliminar un place mediante su id
const deletePlace = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const placeId = req.params.pid;

  let place;

  try {
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    // populate permite referirte a un documento guardado en otra colección y trabajar con su información (las dos colecciones deben estar conectadas en los modelos)
    // entre paréntesis se le pasa información sobre qué queremos cambiar del documento (una propiedad)
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no se pudo eliminar el lugar.',
      500
    );
    return next(error);
  };

  // Compruebo si el sitio existe
  if (!place) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError('No se pudo encontrar el lugar para este id.', 404);
    return next(error);
  };

  // Compruebo si el usuario que manda la solicitud de eliminar el sitio es el mismo que lo ha creado
  // Aquí no uso el toString porque place.creator.id devuelve directamente un string
  if (place.creator.id !== req.userData.userId) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No tienes permiso para eliminar este lugar.',
      401
    );
    return next(error);
  };

  // Guardo la imagen del sitio que quiero borrar, para eliminarla de mis archivos a continuación
  const imagePath = place.image;

  try {
    // Esta sesión nos permite empezar nuestra transacción
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // save() lo da mongoose y funciona junto a los models
    // Elimina el producto en la base de datos especificada en los credenciales, la colección es el primer argumento al crear el modelo 
    await place.remove({ session: sess });

    // Añade el id del sitio al usuario
    // push() es de mongoose y establece la conexión entre los dos modelos (user y place)
    // coge el id de place y lo elimina a los places del user
    place.creator.places.pull(place);
    // Guarda el sitio actualizado
    await place.creator.save({ session: sess });

    // Sólo se guarda la información si ambos saves van bien
    await sess.commitTransaction();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no se pudo eliminar el lugar.',
      500
    );
    return next(error);
  };

  // Le paso a la función la imagen que quiero borrar, y una función de callback que se ejecutará al terminar
  fs.unlink(imagePath, err => {
    console.log(err);
  });

  // Devuelve una respuesta de éxito, y el place modificado
  res.status(200).json({ message: 'Lugar eliminado.' });
};

// Exporta las middleware functions para poder usarlas desde otros archivos
exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;