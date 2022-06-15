// Importo los paquetes necesarios
import React, {useState, useEffect, useContext} from "react";
import { useParams } from 'react-router-dom';
import { useHistory } from "react-router-dom";

// Importo los documentos necesarios
import LugarIndividual from "../componentes/LugarIndividual";
import { useHttpClient } from '../../compartido/hooks/hook-http';
import ErrorModal from "../../compartido/componentes/ElementosUI/ErrorModal";
import SpinnerCarga from "../../compartido/componentes/ElementosUI/SpinnerCarga";
import InfoUsuario from "../../usuario/componentes/InfoUsuario";
import { ContextoAutenticacion } from '../../compartido/contexto/contexto-autenticacion';
import './InfoLugar.css';

// Componente PlaceInfo, lo uso para mostrar la información de un solo sitio (al abrirlo desde el globo)
const InfoLugar = (props) => {
    // Guardo el id del sitio que quiero mostrar, cogiendolo del url
    const placeId = useParams().placeId;

    // Uso useHistory para redireccionar a la página a otro url cuando sea necesario
    const history = useHistory();

    // Guardo las variables globales que ofrece el contexto
    const autenticacion = useContext(ContextoAutenticacion);

    // Estado que guarda si el usuario que estña iniciado sesión sigue al usuario que está viendo
    const [usuarioSeguido, setUsuarioSeguido] = useState();
    // Estado que guarda el sitio que quiero mostrar
    const [lugaresCargados, setLugaresCargados] = useState();
    // Estado que controla los usuarios que se han cargado
    const [usuariosCargados, setUsuariosCargados] = useState({});

    // Guardo las variables que me proporciona el hook personalizado
    const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();

    // Uso useEffect para que solo mande la solicitud la primera vez que llega a la página, y no cada vez que se ejecuta el componente
    // Como mandarSolicitud nunca se volverá a crear (ya que lo he metido en useCallback) es como si no tuviese dependencias
    useEffect(() => {
        // Función que busca la información del usuario que tiene el id que le llega por las props
        const informacionUsuario = async (userId) => {
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

                // Entra si el usuario que estamos viendo tiene al menos un seguidor
                if (datosRespuesta.user.followers) {
                    // Recorremos los seguidores del usuario que está viendo
                    datosRespuesta.user.followers.forEach(followerId => {
                        // Si el id del usuario iniciado sesión está entre los ids de los usuarios que siguen al que está viendo, le decimos al estado que si le sigue
                       if (followerId === autenticacion.userId) {
                        setUsuarioSeguido(true);
                       };
                    });
                // Entra si el usuario que estamos viendo no tiene seguidores
                } else {
                    // Le decimos al estado que el usuario que está iniciado sesión no sigue al usuario que está viendo
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
                // Mando una solicitud post al url indicado (que es el que sirve para coger el sitio indicado en el url), usando el hook personalizado
                // Guardo la respuesta en una variable
                const datosRespuesta = await mandarSolicitud(`http://localhost:3001/api/places/${placeId}/info`);

                // Guardo en el estado los sitios
                setLugaresCargados(datosRespuesta.place);
                informacionUsuario(datosRespuesta.place.creator);
            // Entra si hay un error
            } catch (err) {
                // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
                // Meto esto en try catch para que no haga el auth.login() si le llega un error
                console.log(err);
            };
        };

        // Llamo a la función que he creado para usar el async
        encontrarLugares();
      }, [mandarSolicitud, placeId, autenticacion.userId, usuarioSeguido]);    
      
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
                    idUsuarioSeguido: usuariosCargados.userId, // El id del usuario que está viendo
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
                    idUsuarioSeguido: usuariosCargados.userId, // El id del usuario que está viendo
                    idUsuarioSeguidor: autenticacion.userId // El id del usuario que está iniciado sesión
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

    // Función que se ejecuta al eliminar un sitio
    const eliminarLugarHandler = () => {
        // Al eliminar el sitio uso useHistory para redireccionar a la página principal
        history.push('/');
    };

    // Lo que devuelve al terminar
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
                    <SpinnerCarga />
                </div>
            )}

            {/* 
                Muestra el sitio si no está cargando y si hay algún sitio que mostrar
                Muestra también la información del usuario en el header, pasandole la información necesaria al componente 
                Le paso al componente el todo lo que necesita para mostrar el sitio
            */}
            {!estaCargando && lugaresCargados && usuariosCargados && (
                <React.Fragment>
                    {autenticacion.userId !== usuariosCargados.userId && (
                        <InfoUsuario 
                            image={usuariosCargados.image} 
                            name={usuariosCargados.name} 
                            places={usuariosCargados.places} 
                            userId={usuariosCargados.userId} 
                            btnSitios={true} 
                            btnSeguir={autenticacion.isLoggedIn && !usuarioSeguido} 
                            btnDejarSeguir={autenticacion.isLoggedIn && usuarioSeguido} 
                            seguirUsuarioHandler={seguirUsuarioHandler} 
                            dejarDeSeguirHandler={dejarDeSeguirHandler} 
                        />
                    )}

                    <ul className="lugar-info">
                        <LugarIndividual
                            key={lugaresCargados.id}
                            id={lugaresCargados.id}
                            image={lugaresCargados.image}
                            title={lugaresCargados.title}
                            description={lugaresCargados.description}
                            address={lugaresCargados.address}
                            creatorId={lugaresCargados.creator}
                            coordinates={lugaresCargados.location}
                            onDelete={eliminarLugarHandler}
                        />
                    </ul>
               </React.Fragment>
            )}
        </React.Fragment>
    );
};

// Exporta el componente para poder usarlo desde otros archivos
export default InfoLugar;