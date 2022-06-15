// Importo los paquetes necesarios
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';

// Importo los documentos necesarios
import Input from '../../compartido/componentes/ElementosFormulario/Input';
import Boton from '../../compartido/componentes/ElementosFormulario/Boton';
import Carta from '../../compartido/componentes/ElementosUI/Carta';
import SpinnerCarga from '../../compartido/componentes/ElementosUI/SpinnerCarga';
import ErrorModal from '../../compartido/componentes/ElementosUI/ErrorModal';
import { VALIDATOR_REQUIRE, VALIDATOR_MINLENGTH } from '../../compartido/utiles/validadores';
import { useFormulario } from '../../compartido/hooks/hook-formulario';
import { useHttpClient } from '../../compartido/hooks/hook-http';
import { ContextoAutenticacion } from '../../compartido/contexto/contexto-autenticacion';
import './FormularioLugar.css';

// Componente UpdatePlace, que se encarga de actualizar los sitios
const ActualizarLugar = () => {
  // Guardo en la variable las variables globales que me devuelve el contexto
  const autenticacion = useContext(ContextoAutenticacion);

  // Guardo las variables que me proporciona el hook personalizado
  const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();
  // Estado que controla los sitios que se han cargado
  const [lugarCargado, setLugarCargado] = useState();

  // Guarda el id del sitio especificado en el url (el sitio que queremos actualizar)
  const placeId = useParams().placeId;

  // Guardo el objeto en una constante y lo uso para redireccionar
  const history = useHistory();

  // Uso el hook personalizado, que me devuelve el estado del formulario, la función que se ejecutará al cambiar un input, y la función que se ejecuta para establecer los datos del formulario
  // Le paso los inputs iniciales con sus valores y su validez, y la validez inicial del formulario que los contiene
  const [estadoFormulario, inputHandler, setDatosFormulario] = useFormulario(
    {
      title: {
        value: '',
        isValid: false
      },
      description: {
        value: '',
        isValid: false
      }
    },
    false
  );

  // Uso useEffect para que solo mande la solicitud la primera vez que llega a la página, y no cada vez que se ejecuta el componente
  // Como mandarSolicitud nunca se volverá a crear (ya que lo he metido en useCallback) es como si no tuviese dependencias
  useEffect(() => {
    // Pongo el async aquí y no en la función del useEffect porque useEffect no espera una función que devuelva una promesa (sería código malo)
    const encontrarLugar = async () => {
      // Prueba el código del try y si encuentra un error va al catch
      try {
        // Mando una solicitud post al url indicado (que es el que sirve para coger el sitio usando su id), usando el hook personalizado
        // Guardo la respuesta en una variable
        const datosRespuesta = await mandarSolicitud(`http://localhost:3001/api/places/${placeId}`);

        // Guardo en el estado los sitios
        setLugarCargado(datosRespuesta.place);

        // Función que se ejecutará para establecer los valores que pide el hook (me la proporciona el hook personalizado)
        // Le paso los valores y la validez de los inputs, y el valor de la validez del formulario
        setDatosFormulario(
          {
            title: {
              value: datosRespuesta.place.title,
              isValid: true
            },
            description: {
              value: datosRespuesta.place.description,
              isValid: true
            }
          },
          true
        );
      // Entra si hay un error
      } catch (err) {
        // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
        // Meto esto en try catch para que no haga el auth.login() si le llega un error
        console.log(err);
      };
    };

    // Llamo a la función que he creado para usar el async
    encontrarLugar();
  }, [mandarSolicitud, placeId, setDatosFormulario]);

  // Función que se ejecuta al enviar el formulario para actualizar un sitio
  const actualizarLugarHandler = async event => {
    // Previene el comportamiento predeterminado de los formularios para que no intente recargar la página
    event.preventDefault();

    // Prueba el código del try y si encuentra un error va al catch
    try {
      // Mando una solicitud post al url indicado (que es el que sirve para modificar el sitio usando su id), usando el hook personalizado
      await mandarSolicitud(
        `http://localhost:3001/api/places/${placeId}`,
        // Método
        'PATCH',
        // Body
        JSON.stringify({
          title: estadoFormulario.inputs.title.value,
          description: estadoFormulario.inputs.description.value
        }),
        // Headers
        {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + autenticacion.token // Le paso el token del usuario por los headers
        }
      );

      // Push() es un método de useHistory que te permite redireccionar al url que pones entre paréntesis
      // Uso el contexto general para saber qué usuario está iniciado sesión para redirigirle a sus sitios
      history.push('/' + autenticacion.userId + '/profile');
    // Entra si hay un error
    } catch (err) {
      // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
      // Meto esto en try catch para que no haga el auth.login() si le llega un error
      console.log(err);
    };
  };

  // Entra si está cargando
  if (estaCargando) {
    // Lo que devuelve al terminar
    return (
      // Comprueba si está cargando, y si es así muestra el spinner 
      <div className="center">
        <SpinnerCarga />
      </div>
    );
  };

  // Entra si no existe el sitio especificado en el url
  if (!lugarCargado && !error) {
    // Lo que devuelve al terminar
    return (
      // Devuelve un mensaje de que no existe el sitio especificado
      <div className="center">
        {/* Componente para meter la información en cartas (puramente estético)*/}
        <Carta>
          <h2>No se ha encontrado el sitio!</h2>
        </Carta>
      </div>
    );
  };

  // Lo que devuelve al terminar
  return (
    <React.Fragment>
      {/* 
        Componente que muestra el popup del error 
        Le paso el mensaje de error del estado para que sepa si tiene que ser visible o no, y la función que se ejecutará para resetear el mensaje de error al cerrar el popup
      */}
      <ErrorModal error={error} onClear={borrarError} />

      {/* 
        Muestro el formulario si no está cargando y ha encontrado un sitio
        Al enviar el formulario se ejecuta la función especificada 
      */}
      {!estaCargando && lugarCargado && (
        <form className="formulario-lugar" onSubmit={actualizarLugarHandler}>
          {/* Componente que crea un input personalizado */}
          <Input
            id="title" // Le paso un id
            element="input" // Le paso el tipo de elemento que quiero crear
            type="text" // Le paso el tipo de input que quiero crear
            label="Título" // input para el título
            validators={[VALIDATOR_REQUIRE()]} // Le paso los validadores que quiero que tenga el input
            errorText="Por favor introduzca un título válido." // Le paso el mensaje de error 
            onInput={inputHandler} // Le paso la función que se ejecuta al cambiar el input
            initialValue={lugarCargado.title} // Le paso el valor inicial del input
            initialValid={true} // Le paso la validez inicial del input
          />

          {/* Componente que crea un input personalizado */}
          <Input
            id="description"
            element="textarea"
            label="Descripción"
            validators={[VALIDATOR_MINLENGTH(5)]}
            errorText="Por favor introduzca una descripción válida (min. 5 caracteres)."
            onInput={inputHandler}
            initialValue={lugarCargado.description}
            initialValid={true}
          />

          {/* 
            Componente que crea un botón personalizado para actualizar el sitio
            Lo deshabilito si el formulario no es válido
          */}
          <Boton type="submit" disabled={!estadoFormulario.isValid}>
            ACTUALIZAR LUGAR
          </Boton>
        </form>
      )}
    </React.Fragment>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default ActualizarLugar;