// Importo los paquetes necesarios
import React from 'react';

// Importo los documentos necesarios
import Carta from '../../compartido/componentes/ElementosUI/Carta';
import LugarIndividual from './LugarIndividual';
import './ListaLugares.css';

// Componente PlaceList, sirve para crear la lista de sitios que le llega desde places/pages/userplaces.js
const ListaLugares = props => {
  // Entra si la lista de sitios que le llega por las props está vacía
  if (props.items.length === 0) {
    // Lo que devuelve al terminar
    return (
      <div className="place-list center">
        {/* Componente para meter la información en cartas (puramente estético)*/}
        <Carta>
          {/* Muestra un mensaje de que no existen sitios para dicho usuario */}
          <h2>No se han encontrado lugares</h2>
        </Carta>
      </div>
    );
  }

  // Lo que devuelve al terminar
  return (
    <ul className="lista-lugares">
      {
        // Recorre la lista de sitios y por cada sitio le pasa la información necesaria (que le llega por las props) al siguiente componente para que cree cada item de la lista
        props.items.map(place => (
          <LugarIndividual
            key={place.id} // Le pasa un key
            id={place.id} // Le pasa un id
            image={place.image} // Le pasa una imagen
            title={place.title} // Le pasa un título
            description={place.description} // Le pasa una descripción
            address={place.address} // Le pasa una dirección
            creatorId={place.creator} // Le pasa un creador
            coordinates={place.location} // Le pasa unas coordenadas
            onDelete={props.onDeletePlace} // Le pasa la función que se ejecuta al borrar un sitio
          />
      ))
      }
    </ul>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default ListaLugares;