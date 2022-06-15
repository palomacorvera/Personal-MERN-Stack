// Importo los paquetes necesarios
import React from 'react';

// Importo los documentos necesarios
import './Avatar.css';

// Componente Avatar, sirve para envolver las imágenes y añadirles un estilo
const Avatar = props => {
  return (
    // Permite añadir estilo propio aparte del especificado en el componente
    <div className={`avatar ${props.className}`} style={props.style}>
      {/* Creo la imagen con la información que le llega por las props */}
      <img
        src={props.image}
        alt={props.alt}
        style={{ width: props.width, height: props.width }}
      />
    </div>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default Avatar;