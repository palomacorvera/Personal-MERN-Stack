// Importo los paquetes necesarios
import React, { useRef, useEffect } from 'react';

// Importo los documentos necesarios
import './Mapa.css';

// Componente Map, usa la API de Google Maps para mostrar los mapas con la ubicación de cada sitio
const Mapa = props => {
  // Creo una referencia (o un puntero) que después uso para indicar donde quiero que aparezca el mapa
  const mapRef = useRef();
  
  // Saco las variables de props para añadirlas en la lista de dependencias de useEffect y no poner todas las props
  const { center, zoom } = props;

  // useEffect se ejecutará cuando haya algún cambio en las variables (dependencias) indicadas entre corchetes
  // En la primera renderización se ejecutará porque las dependencias pasan de no existir a existir, pero se ejecutará después del jsx
  // Esto lo hago porque si no intenta usar el mapRef antes de hacer la conexión en el jsx
  useEffect(() => {
    // Creo un mapa y le paso la referencia donde quiero que esté, y configuro el mapa indicando el centro y el zoom (que llegan por las props) 
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom
  });
  
    // Creo el marcador del mapa y le indico que su posición debe ser el centro (indicado en las props) del mapa indicado
    new window.google.maps.Marker({ position: center, map: map });
  }, [center, zoom]);  

  // Lo que devuelve al terminar
  return (
    // En ref pongo la referencia (o el puntero) para indicar que quiero aquí el mapa
    // Permite añadir clases y estilo de forma dimámica mandándolo por las props
    <div ref={mapRef} className={`mapa ${props.className}`} style={props.style}></div>
  );
};

// Exporta el componente para poder usarlo desde otros archivos
export default Mapa;