// Middleware functions que se ejecutan al llegar a cada ruta

// Importa los paquetes necesarios
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importa la clase del error model
const HttpError = require('../modelos/error-http');
// Importa el modelo del usuario
const User = require('../modelos/usuario');

// Middleware function que se ejecuta cuando con la ruta se buscan todos los usuarios
const getUsers = async (req, res, next) => {
  let users;

  try {
    // find() lo da mongoose y convierte todo lo creado con el modelo en un array
    // Poniendo entre paréntesis el parámetro, filtro entre los resultados (quiero todo menos la contraseña)
    // (aquí uso find() en lugar de findById() porque puede haber varios usuario)
    users = await User.find({}, '-password');
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudieron obtener los usuarios, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Uso map porque un array no se puede convertir directamente en un javascript object (un objeto de mongoose si)
  // Devuelvo como respuesta el objeto javascript
  // Quito el _ del id con getters:true
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

// Middleware function que se ejecuta cuando con la ruta se busca un usuario por su id
const getUserById = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const userId = req.params.uid;

  let user;

  try {
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    user = await User.findById(userId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no pudo encontrar ningún usuario.',
      500
    );
    return next(error);
  };

  // Entra si no encuentra el id en el array
  if (!user) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo encontrar el usuario para el id proporcionado.',
      404
    );
    return next(error);
  };

  // Si encuentra el id en el array, devuelve toda su información en formato json
  // Convierto el objeto de mongoose en un objeto javascript con .toObject()
  // Quito el _ del id con getters:true
  res.json({ user: user.toObject({ getters: true }) });
};

// Middleware function que se ejecuta cuando se quiere registrar
const signup = async (req, res, next) => {
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
  const { name, email, password } = req.body;

  let existingUser;

  try {
    // findOne() busca un documento que cumpla el criterio entre paréntesis
    // Comprueba si el email introducido ya existe en la base de datos
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo registrar, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Entra si el email ya está en la base de datos
  if (existingUser) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'El usuario ya existe, inicie sesión en su lugar.',
      422
    );
    return next(error);
  }

  // Variable que guarda la contraseña encriptada
  let hashedPassword;

  try {
    // Primero se le pasa la contraseña, y después el número de bits aleatorios que se usan como una de las entradas en una función derivadora de claves
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo crear el usuario, intente nuevamente más tarde.',
      500
    );
    return next(error);
  };

  // Crea el nuevo usuario con la información obtenida usando el modelo creado en models/user.js
  const createdUser = new User({
    name,
    email,
    image: req.file.path, // Le paso la imagen guardada en los archivos (que viene del formulario también)
    password: hashedPassword,
    followers: [],
    follows: [],
    places: []
  });

  try {
    // save() lo da mongoose y funciona junto a los models
    // Guarda el producto en la base de datos especificada en los credenciales, la colección es el primer argumento al crear el modelo 
    await createdUser.save();
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo registrar, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Variable que guarda la key del usuario iniciado sesión
  let token;

  try {
    // Crea la key del token pasandole la información que queremos encriptar en el token, el nombre de la clave privada, y configuraciones extra (el tiempo de expiración del token)
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo registrar, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Devuelve una respuesta de 201 (algo nuevo se ha creado) y el id, email y token del nuevo usuario
  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

// Middleware function que se ejecuta cuando se quiere iniciar sesión
const login = async (req, res, next) => {
  // Guarda la información que le llega desde el body
  const { email, password } = req.body;

  let existingUser;

  try {
    // findOne() busca un documento que cumpla el criterio entre paréntesis
    // Comprueba si el email introducido ya existe en la base de datos
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo iniciar sesión, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Entra si no existe el usuario 
  if (!existingUser) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Credenciales no válidas, no se pudo iniciar sesión.',
      403
    );
    return next(error);
  };

  // Variable que guarda la validez de la contraseña introducida
  let isValidPassword = false;

  try {
    // Compara la password introducida con la encriptada
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo iniciar sesión, verifique sus credenciales e intente nuevamente.',
      500
    );
    return next(error);
  };

  // Entra si la contraseña introducida no coincide con el usuario
  if (!isValidPassword) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Credenciales no válidas, no se pudo iniciar sesión.',
      403
    );
    return next(error);
  };

  // Variable que guarda la key del usuario iniciado sesión
  let token;

  try {
    // Crea la key del token pasandole la información que queremos encriptar en el token, el nombre de la clave privada, y configuraciones extra (el tiempo de expiración del token)
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
     // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo iniciar sesión, inténtelo de nuevo más tarde.',
      500
    );
    return next(error);
  };

  // Devuelve el id, el email y el token del usuario que ha iniciado sesión
  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

// Middleware function que se ejecuta cuando se quiere seguir a un usuario
const follow = async (req, res, next) => {
  // Saco la información que me llega por el body
  const { idUsuarioSeguido, idUsuarioSeguidor } = req.body;

  // Variables que guardan el id del usuario que sigue y el id del usuario seguido
  let userFollowed;
  let userFollower;

  try {
    // Busco y guardo al usuario que sigue y al usuario seguido
    userFollowed = await User.findById(idUsuarioSeguido);
    userFollower = await User.findById(idUsuarioSeguidor);

    // Entra si no existe el usuario seguido
    if (!userFollowed) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError('No se pudo encontrar el usuario para el id proporcionado.', 404);
      return next(error);
    };

    // Entra si no existe el usuario seguidor
    if (!userFollower) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError('No se pudo encontrar el usuario para el id proporcionado.', 404);
      return next(error);
    };

    try {
      // Mete el id del usuario seguidor en los siguidores del seguido
      userFollowed.followers.push(idUsuarioSeguidor);
      userFollowed.update({'_id': idUsuarioSeguido}, {$set:{'followers': userFollowed.followers}});

      // Mete el id del usuario seguido en los seguidos del seguidor
      userFollower.follows.push(idUsuarioSeguido);
      userFollowed.update({'_id': idUsuarioSeguidor}, {$set:{'follows': userFollower.follows}});
      
      // Guarda la inforamción en la base de datos
      userFollowed.save();
      userFollower.save();
    } catch (err) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'No se pudo seguir al usuario, inténtalo de nuevo.',
        500
      );
      return next(error);
    };
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo seguir al usuario, inténtalo de nuevo.',
      500
    );
    return next(error);
  };

  // Devuelve un mensaje
  res.json({mensaje: 'seguido'});
};

// Middleware function que se ejecuta cuando se quiere dejar de seguir a un usuario
const unfollow = async (req, res, next) => {
  // Guardo la información que me llega por el body
  const { idUsuarioSeguido, idUsuarioSeguidor } = req.body;

  // Variables que guardan los ids del usuario seguido y del usuario seguidor
  let userFollowed;
  let userFollower;

  try {
    // Busca y guarda la información del usuario seguido y del usuario seguidor
    userFollowed = await User.findById(idUsuarioSeguido);
    userFollower = await User.findById(idUsuarioSeguidor);

    // Entra si no existe el usuario seguido
    if (!userFollowed) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError('No se pudo encontrar el usuario para el id proporcionado.', 404);
      return next(error);
    };

    // Entra si no existe el usuario seguidor
    if (!userFollower) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError('No se pudo encontrar el usuario para el id proporcionado.', 404);
      return next(error);
    };

    try {
      // Recorre el array de seguidores del usuario seguido
      userFollowed.followers.forEach(followerId => {
        // Entra si el id actual coincide con el id del usuario seguidor
        if (followerId == idUsuarioSeguidor) {
          // Busca el index del usuario seguidor
          const id = userFollowed.followers.indexOf(followerId);
          // Elimina el id del usuario seguidor del array de seguidores
          userFollowed.followers.splice(id, 1);
        };
      });
      // Reemplaza el array de seguidores con el nuevo (sin el id del seguidor)
      userFollowed.update({'_id': idUsuarioSeguido}, {$set:{'followers': userFollowed.followers}});

      // Recorre el array de seguidos del usuario seguidor
      userFollower.follows.forEach(followsId => {
        // Entra si el id actual coincide con el id del usuario seguido
        if (followsId == idUsuarioSeguido) {
          // Busca el index del usuario seguido
          const id = userFollower.follows.indexOf(followsId);
          // Elimina el id del usuario seguido del array de seguidos
          userFollower.follows.splice(id, 1);
        };
      });
      // Reemplaza el array de seguidos con el nuevo (sin el id del seguidos)
      userFollowed.update({'_id': idUsuarioSeguidor}, {$set:{'follows': userFollower.follows}});
      
      // Guarda los datos en la base de datos
      userFollowed.save();
      userFollower.save();
    } catch (err) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'No se pudo dejar de seguir al usuario, inténtalo de nuevo.',
        500
      );
      return next(error);
    };
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo seguir al usuario, inténtalo de nuevo.',
      500
    );
    return next(error);
  };

  // Devuelve un mensaje
  res.json({mensaje: 'seguido'});
};

// Middleware function que se ejecuta cuando con la ruta se buscan los seguidores de un usuario
const getUserFollowers = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const userId = req.params.uid;

  let user;

  try {
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    user = await User.findById(userId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no pudo encontrar ningún usuario.',
      500
    );
    return next(error);
  };

  // Entra si no encuentra el id en el array
  if (!user) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo encontrar el usuario para el id proporcionado.',
      404
    );
    return next(error);
  };

  // Variable que guarda los ids de los seguidores del usuario
  let followers = user.followers;
  // Array que guarda la información de los seguidores del usuario
  let followersInfo = [];

  // Recorre el array de ids
  for (let i = 0; i < followers.length; i++) {
    try {
      // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
      // (No devuelve una promise real)
      user = await User.findById(followers[i]);
    } catch (err) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'Algo salió mal, no pudo encontrar ningún usuario.',
        500
      );
      return next(error);
    };
  
    // Entra si no encuentra el id en el array
    if (!user) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'No se pudo encontrar el usuario para el id proporcionado.',
        404
      );
      return next(error);
    };

    // Guarda la información del usuario en el array 
    followersInfo.push(user);
  };

  // Devuelve el array de seguidores
  res.json({ user: followersInfo });
};

// Middleware function que se ejecuta cuando con la ruta se buscan los seguidos del usuario
const getUserFollows = async (req, res, next) => {
  // Recupera de la ruta el id dinámico
  const userId = req.params.uid;

  let user;

  try {
    // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
    // (No devuelve una promise real)
    user = await User.findById(userId);
  } catch (err) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'Algo salió mal, no pudo encontrar ningún usuario.',
      500
    );
    return next(error);
  };

  // Entra si no encuentra el id en el array
  if (!user) {
    // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
    // (Este error le llega al middleware que maneja errores en app.js)
    const error = new HttpError(
      'No se pudo encontrar el usuario para el id proporcionado.',
      404
    );
    return next(error);
  };

  // Variable que guarda los ids de los seguidos del usuario
  let follows = user.follows;
  // Array que guarda la información de los seguidos del usuario
  let followsInfo = [];

  // Recorre los ids 
  for (let i = 0; i < follows.length; i++) {
    try {
      // Busca en los documentos creados con el modelo y devuelve el que tiene el id que coincide con el especificado entre paréntesis
      // (No devuelve una promise real)
      user = await User.findById(follows[i]);
    } catch (err) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'Algo salió mal, no pudo encontrar ningún usuario.',
        500
      );
      return next(error);
    };
  
    // Entra si no encuentra el id en el array
    if (!user) {
      // Crea un error con la clase del error model, indicando el mensaje y el tipo de error, y lo devuelve
      // (Este error le llega al middleware que maneja errores en app.js)
      const error = new HttpError(
        'No se pudo encontrar el usuario para el id proporcionado.',
        404
      );
      return next(error);
    };

    // Guarda la información del seguido en el array
    followsInfo.push(user);
  };

  // Devuelve el array de los seguidos
  res.json({ user: followsInfo });
};

// Exporta las middleware functions para poder usarlas desde otros archivos
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.signup = signup;
exports.login = login;
exports.follow = follow;
exports.unfollow = unfollow;
exports.getUserFollowers = getUserFollowers;
exports.getUserFollows = getUserFollows;