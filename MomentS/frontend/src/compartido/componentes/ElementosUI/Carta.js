// Importo los paquetes necesarios
import React from 'react';

// Importo los documentos necesarios
import './Carta.css';

// Componente Card, es un div con un estilo bonito para envolver el contenido (es puramente estético)
const Carta = props => {
  return (
    // Permite añadir estilo propio aparte del especificado en el componente
    <div className={`carta ${props.className}`} style={props.style}>
      {/* Incluye dentro todo lo que le metas entre las tags del componente */}
      {props.children}
    </div>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default Carta;