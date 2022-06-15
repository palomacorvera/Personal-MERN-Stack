// Importo los paquetes necesarios
import { createContext } from 'react';

// Contexto que crea variables globales para poder usarlas por toda la app
export const ContextoAutenticacion = createContext({
  // Establece los valores iniciales de las variables y funciones para usarlas más tarde
  isLoggedIn: false, // Controla si estás iniciado sesión
  userId: null, // Controla el id del usuario
  token: null, // Controla el token del usuario para saber si está iniciado sesión
  login: () => {}, // Función que se ejecuta al iniciar sesión
  logout: () => {} // Función que se ejecuta al cerrar sesión
});
