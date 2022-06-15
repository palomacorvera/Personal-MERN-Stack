// Rutas relacionadas con los places a las que se puede llegar con la app

// Importa los paquetes necesarios
const express = require('express');
const { check } = require('express-validator');

// Importa las middleware functions de places-controllers.js
const placesControllers = require('../controllers/controllers-lugares');
const fileUpload = require('../middleware/cargar-archivo');
const checkAuth = require('../middleware/comprobar-autenticacion');

// Cogemos la erramienta Router de express
const router = express.Router();

// Llaman a las middleware functions indicadas (que se encuentra en el archivo places-controllers.js)

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /allPlaces, y es una solicitud de get
router.get('/allPlaces', placesControllers.getPlaces);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más un id dinámico, y es una solicitud de get
router.get('/:pid', placesControllers.getPlaceById);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más un id dinámico y /info, y es una solicitud de get
router.get('/:pid/info', placesControllers.getPlaceById);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más /user y un id dinámico
router.get('/user/:uid', placesControllers.getPlacesByUserId);

// Middleware que protege las de abajo de ser accedidas por una solicitud que no contiene un token válido (indicando que el usuario que intenta acceder está iniciado sesión)
// Las middleware se ejecutan de arriba a abajo, si esta para la solicitud, no podrá llegar a las de abajo
router.use(checkAuth);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js
// Antes de ejecutar la middleware function de places-controllers.js se ejecutan  las de check para validar la información que llega en el body
// (Después del filtro de ruta puedes ejecutar tantas middleware functions como quieras)
// (Se comprueba si las validaciones dan error en places-controller.js)
router.post(
  '/',
  fileUpload.single('image'), // Busca una solicitud con un key en el body que sea 'image' para saber cual es la imagen 
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address')
      .not()
      .isEmpty()
  ],
  placesControllers.createPlace
);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más un id dinámico, y es una solicitud de patch
router.patch(
  '/:pid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  placesControllers.updatePlace
);

// Se ejecuta cuando la ruta es la indicada al recuperarlo desde app.js más un id dinámico, y es una solicitud de delete
router.delete('/:pid', placesControllers.deletePlace);

// Exporta los middleware anteriores para poder usarlos en app.js
module.exports = router;