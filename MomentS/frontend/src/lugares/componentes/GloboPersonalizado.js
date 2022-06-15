// Importo los paquetes necesarios
import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";

// Importo los documentos necesarios
import HEX_DATA from "./data/countries_hex_data.json";
import Globe from "react-globe.gl";
import { useHttpClient } from '../../compartido/hooks/hook-http';
import ErrorModal from "../../compartido/componentes/ElementosUI/ErrorModal";
import SpinnerCarga from "../../compartido/componentes/ElementosUI/SpinnerCarga";
import './GloboPersonalizado.css';

// Exporto la función que crea el globo que muestra todos los sitios en el mapa del mundo
export default function GloboPersonalizado() {
  // Uso useHistory para redireccionar a otro url cuando sea necesario
  let history = useHistory();

  // Uso useRef para crear una referencia con el globo
  const globeEl = useRef();

  // Guardo las variables que me proporciona el hook personalizado
  const { estaCargando, error, mandarSolicitud, borrarError } = useHttpClient();

  // Estado que controla los sitios que se van a mostrar en el globo
  const [selectedCountries, setSelectedCountries] = useState([]);
  // Estado que controla las características del mapa (lo requiere la librería react-globe.gl)
  const [hex, setHex] = useState({ features: [] });

    // useEffect se ejecutará cuando las dependencias indicadas cambien (para evitar que la función se ejecute cada vez que lo hace el componente)
    useEffect(() => {
      // Pongo el async aquí y no en la función del useEffect porque useEffect no espera una función que devuelva una promesa (sería código malo)
      const fetchUsers = async () => {
        // Prueba el código del try y si encuentra un error va al catch
        try {
          // Mando una solicitud post al url indicado (que es el que sirve para coger todos los sitios), usando el hook personalizado
          // Guardo la respuesta en una variable
          const responseData = await mandarSolicitud(
            'http://localhost:3001/api/places/allPlaces'
          );

          // Creo el array que guardará todos los sitios para después pasarselo al globo
          const arrayPlaces = [];

          // Guardo en el array la latitud, longitud, titulo e id de cada sitio
          responseData.places.forEach(place => {
            arrayPlaces.push({
              lat: place.location.lat,
              lng: place.location.lng,
              label: place.title,
              id: place.id
            });
          });

          // Guardo en el estado los sitios
          setSelectedCountries(arrayPlaces);
        // Entra si hay un error
        } catch (err) {
          // No hace falta hacer nada aquí porque ya controla el error el catch del hook personalizado
          // Meto esto en try catch para que no haga el auth.login() si le llega un error
          console.log(err);
        };
      };
  
      // Llamo a la función que he creado para usar el async
      fetchUsers();
    }, [mandarSolicitud]);

  // useEffect se ejecutará solo la primera vez, ya que tiene las dependencias vacías
  useEffect(() => {
    // Guarda las características del globo en el estado (las coge de un archivo que viene con la librería)
    setHex(HEX_DATA);
  }, []);

  // useEffect se ejecutará cuando las dependencias indicadas cambien (para evitar que la función se ejecute cada vez que lo hace el componente)
  useEffect(() => {
    // Guardo el centro del mapa predeterminado
    const MAP_CENTER = { lat: 0, lng: 0, altitude: 1.5 };

    // Indico al globo cual tiene que ser su centro predeterminado (el sitio que se verá en el centro nada mas abrir el globo)
    globeEl.current.pointOfView(MAP_CENTER, 0);
  }, [globeEl]);

  // Función que se ejecuta al clickar sobre un sitio del mapa
  const labelClickHandler = (info) => {
    // Saca el id del sitio que ha sido clickado (que le llega por las props)
    const placeId = info.id;

    // Redirecciono al url del sitio clickado
    history.push('/places/' + placeId + '/info');
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
            {/* Componente que muestra el spinner de carga */}
            <SpinnerCarga />
          </div>
        )}

        {/* Componente que ofrece la librería react-globe.gl para mostrar un globo */}
        <div className="globo-personalizado">
          <Globe
            ref={globeEl} // Referencia que hemos creado antes
            backgroundColor="#555358" // Color de fondo del globo
            labelsData={selectedCountries} // Array de sitios que se mostrarán en el globo
            labelText={"label"} // Texto que tendrá la label
            labelSize={1} // Tamaño de la label
            labelColor={useCallback(() => "#f5f5f5", [])} // Color de la label
            labelDotRadius={0.3} // Radio del circulo de la label
            labelAltitude={0.05} // Altura de la label
            onLabelClick={labelClickHandler} // Función que se ejecuta al hacer click sobre la label
            hexPolygonsData={hex.features} // Características del globo (establece la forma de los contienentes)
            hexPolygonResolution={3} // Resolución de los puntos del globo que muestran los continentes
            hexPolygonMargin={0.6} // Margen de los puntos del globo que muestran los continentes
            hexPolygonColor={useCallback(() => "#8ba6a9", [])} // Color de los puntos del globo que muestran los continentes
          />
        </div>
      </React.Fragment>
  );
};