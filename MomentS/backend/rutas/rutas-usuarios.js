// Rutas relacionadas con los users a las que se puede llegar con la app

// Importa los paquetes necesarios
const express = require('express');
const { check } = require('express-validator');

// Importa las middleware functions de user-controllers.js y de file-upload.js
const usersController = require('../controllers/controllers-usuarios');
const fileUpload = require('../middleware/cargar-archivo');

// Cogemos la erramienta Router de express
const router = express.Router();

// Llaman a las middleware functions indicadas (que se encuentra en el archivo places-controllers.js)

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js
router.get('/', usersController.getUsers);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js
router.get('/:uid', usersController.getUserById);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js
router.get('/:uid/followers', usersController.getUserFollowers);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js
router.get('/:uid/follows', usersController.getUserFollows);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /signup
// Antes de ejecutar la middleware function de user-controller.js se ejecutan  las de check para validar la información que llega en el body
// (Después del filtro de ruta puedes ejecutar tantas middleware functions como quieras)
// (Se comprueba si las validaciones dan error en user-controller.js)
router.post(
  '/signup',
  fileUpload.single('image'), // Busca una solicitud con un key en el body que sea 'image' para saber cual es la imagen
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  usersController.signup
);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /follow
router.post('/follow', usersController.follow);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /unfollow
router.post('/unfollow', usersController.unfollow);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /login
router.post('/login', usersController.login);

// Exporta los middleware anteriores para poder usarlos en app.js
module.exports = router;