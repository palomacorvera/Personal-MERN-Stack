// Importo los paquetes necesarios
import React, { useState, useContext } from 'react';

// Importo los documentos necesarios
import Carta from '../../compartido/componentes/ElementosUI/Carta';
import Boton from '../../compartido/componentes/ElementosFormulario/Boton';
import Modal from '../../compartido/componentes/ElementosUI/Modal';
import Mapa from '../../compartido/componentes/ElementosUI/Mapa';
import ErrorModal from '../../compartido/componentes/ElementosUI/ErrorModal';
import SpinnerCarga from '../../compartido/componentes/ElementosUI/SpinnerCarga';
import { ContextoAutenticacion } from '../../compartido/contexto/contexto-autenticacion';
import { useHttpClient } from '../../compartido/hooks/hook-http';
import './LugarIndividual.css';

// Componente PlaceItem, sirve para crear cada sitio de la lista de sitios usando la información que le llega desde places/components/placelist.js
const LugarIndividual = props => {
  // Guardo las variables que me proporciona el hook personalizado
  const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();

  // Guardo las variables globales que ofrece el contexto
  const autenticacion = useContext(ContextoAutenticacion);

  // Creo un estado que controla si el mapa es visible o no, y establezco su valor inicial a falso
  const [mostrarMapa, setMostrarMapa] = useState(false);
  // Creo un estado que controla si el modal es visible o no, y establezco su valor inicial a falso
  const [mostarModalConfirmar, setMostarModalConfirmar] = useState(false);

  // Función que establece que el mapa sea visible
  const abrirMapaHandler = () => setMostrarMapa(true);
  // Función que establece que el mapa no sea visible
  const cerrarMapaHandler = () => setMostrarMapa(false);

  // Función que establece que el modal sea visible (para que muestre el aviso al intentar borrar un sitio)
  const mostrarAdvertenciaEliminarHandler = () => {
    setMostarModalConfirmar(true);
  };

  // Función que establece que el modal sea invisible (para que desaparezca el aviso al intentar borrar un sitio)
  const cancelarEliminarHandler = () => {
    setMostarModalConfirmar(false);
  };

  // Función que establece que el modal sea invisible (para que desaparezca el aviso al intentar borrar un sitio) al confirmar que quieres borrar el sitio
  const confirmarEliminarHandler = async () => {
    // Reinicio el valor del estado que controla si el modal es visible o no
    setMostarModalConfirmar(false);

    // Prueba el código del try y si encuentra un error va al catch
    try {
      // Mando una solicitud post al url indicado (que es el que sirve para eliminar un sitio con su id), usando el hook personalizado
      await mandarSolicitud(
        `http://localhost:3001/api/places/${props.id}`,
        // Method
        'DELETE',
        // Body
        null,
        // Headers 
        { Authorization: 'Bearer ' + autenticacion.token } // Le paso el token del usuario por los headers
      );

      // Ejecuto la función que elimina el sitio pasandole el id del que quiero borrar
      props.onDelete(props.id);
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

      {/* Componente popup que muestra el mapa */}
      <Modal
        show={mostrarMapa} // Determina si es visible o no
        onCancel={cerrarMapaHandler} // Función que se ejecuta al darle a cancelar
        header={props.address} // Encabezado del modal
        contentClass="lugar-individual__modal-contenido" // Clases del contenido
        footerClass="lugar-individual__modal-acciones" // Clases del pie
        footer={ // Pie del modal
          // Componente que crea un botón personalizado y le pasa una función para cerrar el mapa al hacerle click
          <Boton onClick={cerrarMapaHandler}>CERRAR</Boton>}
      >

        <div className="mapa-contenedor">
          {/* 
            Componente que muestra el mapa 
            Le paso las coordenadas del mapa y el zoom que debe tener
          */}
          <Mapa center={props.coordinates} zoom={16} />
        </div>
      </Modal>

      {/* Componente popup que muestra el mensaje de aviso al intentar borrar un sitio */}
      <Modal
        show={mostarModalConfirmar}
        onCancel={cancelarEliminarHandler}
        header="Estás seguro?"
        footerClass="lugar-individual__modal-acciones"
        footer={
          <React.Fragment>
            {/* Componente que crea un botón personalizado y le pasa el inverse y una función para cancelar el eliminar al hacerle click */}
            <Boton inverse onClick={cancelarEliminarHandler}>
              CANCELAR
            </Boton>

            {/* Componente que crea un botón personalizado y le pasa el danger y una función para confirmar el eliminar al hacerle click */}
            <Boton danger onClick={confirmarEliminarHandler}>
              ELIMINAR
            </Boton>
          </React.Fragment>
        }
      >

        {/* Mensaje de aviso */}
        <p>
          Quieres continuar y eliminar este lugar? Por favor, recuerda que no podrás deshacer el cambio.
        </p>
      </Modal>

      {/* Item del sitio (se renderiza tantas veces como sitios haya en PlacesList.js) */}
      <li className="lugar-individual">
        {/* Componente para meter la información en cartas (puramente estético)*/}
        <Carta className="lugar-individual__contenido">
          {/* Comprueba si está cargando, y si es así muestra el spinner */}
          {estaCargando && <SpinnerCarga asOverlay />}

          <div className="lugar-individual__imagen">
            {/* Le paso a la imagen el src y el alt que me llega por las props */}
            <img
              src={`http://localhost:3001/${props.image}`}
              alt={props.title}
            />
          </div>

          <div className="lugar-individual__info">
            {/* Título que llega por las props */}
            <h2>{props.title}</h2>
            {/* Dirección que llega por las props */}
            <h3>{props.address}</h3>
            {/* Descripción que llega por las props */}
            <p>{props.description}</p>
          </div>

          <div className="lugar-individual__acciones">
            {/* 
              Componente que crea un botón personalizado 
              Le paso que debe ser inverse, y la función para abrir el mapa que se ejecutará al hacerle click
            */}
            <Boton inverse onClick={abrirMapaHandler}>
              VER EN EL MAPA
            </Boton>

            {/* Si estamos iniciados sesión muestra el botón de editar y el botón de eliminar (de nuestros sitios) */}
            {/* Al botón de editar le paso el id del sitio en el que estoy para que sepa cuál quiero editar */}
            {/* Al botón de borrar le indico que debe ser de danger, y la función de mostrar el aviso antes de eliminar que se ejecutará al hacerle click */}
            {autenticacion.userId === props.creatorId && (
              <Boton to={`/places/${props.id}`}>EDITAR</Boton>
            )}

            {autenticacion.userId === props.creatorId && (
              <Boton danger onClick={mostrarAdvertenciaEliminarHandler}>
                ELIMINAR
              </Boton>
            )}
          </div>
        </Carta>
      </li>
    </React.Fragment>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default LugarIndividual;