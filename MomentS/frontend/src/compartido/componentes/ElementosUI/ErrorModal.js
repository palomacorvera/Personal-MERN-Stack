//Importo los paquetes necesarios
import React from 'react';

//Importo los documentos necesarios
import Modal from './Modal';
import Button from '../ElementosFormulario/Boton';

// Componente ErrorModal, se encagra de mostrar el mensaje de error
const ErrorModal = props => {
  // Lo que devuelve al terminar
  return (
    // Usa el componente Modal para crear el popup del error
    <Modal
      onCancel={props.onClear} // Le pasa la función para cancelar
      header="Ha ocurrido un error!" // Le pasa el título
      show={!!props.error} // Determina si es visible o no (es visible si error no está vacío)
      footer={<Button onClick={props.onClear}>Okay</Button>}  // Le pasa el botón que tiene que ir al pie y la función que se ejecutará al clickar el botón
    >
      <p>{props.error}</p> {/* Muestra el mensaje de error */}
    </Modal>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default ErrorModal;