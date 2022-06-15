// Importo los paquetes necesarios
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

// Importo los documentos necesarios
import Input from '../../compartido/componentes/ElementosFormulario/Input';
import Boton from '../../compartido/componentes/ElementosFormulario/Boton';
import ErrorModal from '../../compartido/componentes/ElementosUI/ErrorModal';
import SpinnerCarga from '../../compartido/componentes/ElementosUI/SpinnerCarga';
import ImagenCarga from '../../compartido/componentes/ElementosFormulario/ImagenCarga';
import { VALIDATOR_REQUIRE, VALIDATOR_MINLENGTH } from '../../compartido/utiles/validadores';
import { useFormulario } from '../../compartido/hooks/hook-formulario';
import { useHttpClient } from '../../compartido/hooks/hook-http';
import { ContextoAutenticacion } from '../../compartido/contexto/contexto-autenticacion';
import './FormularioLugar.css';

// Componente NewPlace, que sirve para crear un nuevo sitio
const NuevoLugar = () => {
  // Guardo en la variable las variables globales que me devuelve el contexto
  const autenticacion = useContext(ContextoAutenticacion);

  // Guardo las variables que me proporciona el hook personalizado
  const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();

  // Uso el hook personalizado, que me devuelve el estado del formulario y la función que se ejecutará al cambiar un input
  // Le paso los inputs iniciales con sus valores y su validez, y la validez inicial del formulario que los contiene
  const [estadoFormulario, inputHandler] = useFormulario(
    {
      title: {
        value: '',
        isValid: false
      },
      description: {
        value: '',
        isValid: false
      },
      address: {
        value: '',
        isValid: false
      },
      image: {
        value: null,
        isValid: false
      }
    },
    false
  );

  // Guardo el objeto en una constante y lo uso para redireccionar
  const history = useHistory();

  // Función que se ejecuta al hacer submit en el formulario
  const enviarLugarHandler = async event => {
    // Previene el comportamiento predeterminado de los formularios para que no intente recargar la página
    event.preventDefault();

    // Prueba el código del try y si encuentra un error va al catch
    try {
      // FormData viene con el browser y lo usaré para pasar la información de la imagen ya que al ser binario no puede pasarse con json
      const datosFormulario = new FormData();

      // Añado los datos que recojo del formulario de registro al datosFormulario
      datosFormulario.append('title', estadoFormulario.inputs.title.value);
      datosFormulario.append('description', estadoFormulario.inputs.description.value);
      datosFormulario.append('address', estadoFormulario.inputs.address.value);
      datosFormulario.append('image', estadoFormulario.inputs.image.value);

      // Mando una solicitud post al url indicado (que es el que sirve para crear un nuevo sitio), usando el hook personalizado
      await mandarSolicitud(
        'http://localhost:3001/api/places', 
        // method
        'POST', 
         // Le mando la información que espera el backend
        datosFormulario,
        // headers
        {Authorization: 'Bearer ' + autenticacion.token} // Le paso el token del usuario por los headers
      );

      // Push() es un método de useHistory que te permite redireccionar al url que pones entre paréntesis
      history.push('/');
    // Entra si hay un error
    } catch (err) {
      // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
      // Meto esto en try catch para que no haga el auth.login() si le llega un error
      console.log(err);
    };
  };

  // Lo que devuelve al terminar
  return (
    <React.Fragment>
      {/* 
        Componente que muestra el popup del error 
        Le paso el mensaje de error del estado para que sepa si tiene que ser visible o no, y la función que se ejecutará para resetear el mensaje de error al cerrar el popup
      */}
      <ErrorModal error={error} onClear={borrarError} />

      {/* Al enviar el formulario se ejecuta la función especificada, que se encarga de crear el nuevo sitio */}
      <form className="formulario-lugar" onSubmit={enviarLugarHandler}>
        {/* Comprueba si está cargando, y si es así muestra el spinner */}
        {estaCargando && <SpinnerCarga asOverlay />}

        {/* Componente que crea un input personalizado */}
        <Input
          id="title" // Le paso un id
          element="input" // Le paso el tipo de elemento que quiero crear
          type="text" // Le paso el tipo de input que quiero crear
          label="Título" // Input para el título
          validators={[VALIDATOR_REQUIRE()]} // Le paso los validadores que quiero que tenga el input
          errorText="Por favor introduzca un título válido." // Le paso el mensaje de error 
          onInput={inputHandler} // Le paso la función que se ejecuta al cambiar el input
        />

        {/* Componente que crea un input personalizado */}
        <Input
          id="description"
          element="textarea"
          label="Descripción"
          validators={[VALIDATOR_MINLENGTH(5)]}
          errorText="Por favor introduzca una descripción válida (al menos 5 caracteres)."
          onInput={inputHandler}
        />

        {/* Componente que crea un input personalizado */}
        <Input
          id="address"
          element="input"
          label="Dirección"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Por favor introduzca una dirección válida."
          onInput={inputHandler}
        />

        {/* Componente que crea un input para la imagen */}
        <ImagenCarga id="image" onInput={inputHandler} errorText="Por favor proporcione una imagen."/>
        {/* 
          Componente que crea un botón personalizado para añadir el sitio
          Lo deshabilito si el formulario no es válido
        */}
        <div className="margin-top">
          <Boton type="submit" disabled={!estadoFormulario.isValid}>
            AÑADIR LUGAR
          </Boton>
        </div>
      </form>
    </React.Fragment>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default NuevoLugar;