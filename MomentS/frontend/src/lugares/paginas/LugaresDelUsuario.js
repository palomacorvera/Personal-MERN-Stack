// Importo los paquetes necesarios
import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';

// Importo los documentos necesarios
import ListaLugares from '../componentes/ListaLugares';
import ErrorModal from '../../compartido/componentes/ElementosUI/ErrorModal';
import SpinnerCarga from '../../compartido/componentes/ElementosUI/SpinnerCarga';
import { useHttpClient } from '../../compartido/hooks/hook-http';
import InfoUsuario from '../../usuario/componentes/InfoUsuario';
import './LugaresDelUsuario.css';
import { ContextoAutenticacion } from '../../compartido/contexto/contexto-autenticacion';

// Componente UserPlaces, se encarga de fetchear todos los sitios para mostrarlos
const LugaresDelUsuario = () => {
  // Estado que controla los sitios que se han cargado
  const [lugaresCargados, setLugaresCargados] = useState();
  // Estado que controla los usuarios que se han cargado
  const [usuariosCargados, setUsuariosCargados] = useState();
  // Estado que controla si sigue al usuario
  const [usuarioSeguido, setUsuarioSeguido] = useState();

  // Guardo las variables globales que ofrece el contexto
  const autenticacion = useContext(ContextoAutenticacion);

  // Guardo las variables que me proporciona el hook personalizado
  const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();

  // Coge el id del usuario de la url
  const userId = useParams().userId;

  // Uso useEffect para que solo mande la solicitud la primera vez que llega a la página, y no cada vez que se ejecuta el componente
  // Como mandarSolicitud nunca se volverá a crear (ya que lo he metido en useCallback) es como si no tuviese dependencias
  useEffect(() => {
    // Pongo el async aquí y no en la función del useEffect porque useEffect no espera una función que devuelva una promesa (sería código malo)
    const informacionUsuario = async () => {
      // Prueba el código del try y si encuentra un error va al catch
      try {
        // Mando una solicitud post al url indicado (que es el que sirve para coger todas la informacion de un usuario), usando el hook personalizado
        // Guardo la respuesta en una variable
        const datosRespuesta = await mandarSolicitud(`http://localhost:3001/api/users/${userId}`);

        // Guardo en el estado los sitios
        setUsuariosCargados({
          'userId': userId,
          'image': datosRespuesta.user.image,
          'name': datosRespuesta.user.name,
          'places': datosRespuesta.user.places.length
        });

        // Entra si el usuario tiene seguidores
        if (datosRespuesta.user.followers) {
          // Recorre lo seguidores del usuario
          datosRespuesta.user.followers.forEach(followerId => {
            // Entra si el usuario iniciado sesión sigue a este usuario y lo guarda en el estado
             if (followerId === autenticacion.userId) {
              setUsuarioSeguido(true);
             };
          });
        // Entra si el usuario no tiene seguidores
        } else {
          // Guarda en el estado que el usuario que está iniciado sesión no sigue a este usuario
          setUsuarioSeguido(false);
        };
      // Entra si hay un error
      } catch (err) {
        // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
        // Meto esto en try catch para que no haga el auth.login() si le llega un error
        console.log(err);
      };
    };

    // Pongo el async aquí y no en la función del useEffect porque useEffect no espera una función que devuelva una promesa (sería código malo)
    const encontrarLugares = async () => {
      // Prueba el código del try y si encuentra un error va al catch
      try {
        // Mando una solicitud post al url indicado (que es el que sirve para coger todos los sitios de un usuario), usando el hook personalizado
        // Guardo la respuesta en una variable
        const datosRespuesta = await mandarSolicitud(`http://localhost:3001/api/places/user/${userId}`);

        // Guardo en el estado los sitios
        setLugaresCargados(datosRespuesta.places);
        informacionUsuario();
      // Entra si hay un error
      } catch (err) {
        // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
        // Meto esto en try catch para que no haga el auth.login() si le llega un error
        console.log(err);
      };
    };

    // Llamo a la función que he creado para usar el async
    encontrarLugares();
  }, [mandarSolicitud, userId, autenticacion.userId, usuarioSeguido]);

  // Función que se ejecuta al pulsar el botón de dejar de seguir
  const dejarDeSeguirHandler = async () => {
    try {
        // Mando una solicitud post al url indicado (que es el que sirve para seguir a un usuario), usando el hook personalizado
        await mandarSolicitud(
            'http://localhost:3001/api/users/unfollow', 
            // method
            'POST', 
            // Le mando la información que espera el backend
            JSON.stringify({ 
                idUsuarioSeguido: userId, // El id del usuario que está viendo
                idUsuarioSeguidor: autenticacion.userId  // El id del usuario que está iniciado sesión
            }),
            // headers
            {
                Authorization: 'Bearer ' + autenticacion.token,
                'Content-Type': 'application/json'
            } // Le paso el token del usuario por los headers
        );

         // Le digo al estado que no sigue al usuario
        setUsuarioSeguido(false);
    } catch (err) {
        // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
        // Meto esto en try catch para que no haga el auth.login() si le llega un error
        console.log(err);
    };
};

  // Función que se ejecuta al pulsar el botón de seguir
  const seguirUsuarioHandler = async () => {
    try {
        // Mando una solicitud post al url indicado (que es el que sirve para seguir a un usuario), usando el hook personalizado
        await mandarSolicitud(
            'http://localhost:3001/api/users/follow', 
            // method
            'POST', 
            // Le mando la información que espera el backend
            JSON.stringify({ 
                idUsuarioSeguido: userId, // El id del usuario que está viendo
                idUsuarioSeguidor: autenticacion.userId // El id del usuario que está iniciado sesión
            }),
            // headers
            {
                Authorization: 'Bearer ' + autenticacion.token,
                'Content-Type': 'application/json'
            } // Le paso el token del usuario por los headers
        );

        // Le digo al estado que sí sigue al usuario
        setUsuarioSeguido(true);
    } catch (err) {
        // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
        // Meto esto en try catch para que no haga el auth.login() si le llega un error
        console.log(err);
    };
};

  // Función que se ejecuta al eliminar un sitio
  const eliminarLugarHandler = deletedPlaceId => {
    // Modifica el estado de los sitios cargados eliminando el sitio que pretendemos eliminar
    setLugaresCargados(prevPlaces =>
      prevPlaces.filter(place => place.id !== deletedPlaceId)
    );
  };

  // Le pasa la lista de sitios al siguiente componente para que los muestre
  return (
    <React.Fragment>
      {/* 
        Componente que muestra el popup del error 
        Le paso el mensaje de error del estado para que sepa si tiene que ser visible o no, y la función que se ejecutará para resetear el mensaje de error al cerrar el popup
      */}
      <ErrorModal error={error} onClear={borrarError} />

      {/* Comprueba si está cargando, y si es así muestra el spinner */}
      {estaCargando && (
        <div className="center">
          {/* Componente que muestra el spinner de carga */}
          <SpinnerCarga />
        </div>
      )}

      {/* 
        Muestra la lista de sitios si no está cargando y si hay algún sitio que mostrar 
        Muestra también la información del usuario en el header, pasandole la información necesaria al componente
        Le paso al componente la lista de sitios y la función a ejecutar al eliminar uno
      */}
      {!estaCargando && lugaresCargados && usuariosCargados && (
        <div>
          {/* Si el usuario que queremos ver no es el nuestro, muestra la información del usuario */}
          {usuariosCargados.userId !== autenticacion.userId && (
            <InfoUsuario 
              image={usuariosCargados.image} 
              name={usuariosCargados.name} 
              places={usuariosCargados.places} 
              userId={userId} 
              btnSitios={false} 
              btnSeguir={autenticacion.isLoggedIn && !usuarioSeguido} 
              btnDejarSeguir={autenticacion.isLoggedIn && usuarioSeguido} 
              seguirUsuarioHandler={seguirUsuarioHandler} 
              dejarDeSeguirHandler={dejarDeSeguirHandler} 
            />
          )}

          <ListaLugares items={lugaresCargados} onDeletePlace={eliminarLugarHandler} />
        </div>
      )}
    </React.Fragment>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default LugaresDelUsuario;