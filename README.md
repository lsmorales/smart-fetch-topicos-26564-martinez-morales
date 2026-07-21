# SmartFetch

[![npm version](https://badge.fury.io/js/smartfetch.svg)](https://badge.fury.io/js/smartfetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SmartFetch** es una librería cliente HTTP avanzada construida sobre la API nativa `fetch` de JavaScript/TypeScript. Añade funcionalidades esenciales para aplicaciones modernas como **timeout configurable**, **reintentos automáticos con backoff exponencial**, y un **manejo de errores robusto y tipado** usando patrones de programación funcional (tipos suma / Either).

Ideal para proyectos que necesitan comunicación con APIs REST sin la sobrecarga de librerías pesadas, manteniendo un alto nivel de seguridad de tipos.

---

## Características

- **Timeout configurable**: Establece un tiempo máximo de espera para cualquier petición.
- **Reintentos automáticos**: Reintenta peticiones fallidas en errores 5xx o de red, con backoff exponencial.
- **Métodos HTTP**: Soporte nativo para `GET`, `POST`, `PUT`, `PATCH` y `DELETE`.
- **100% TypeScript**: Tipado fuerte con inferencia de tipos y guardas de tipo (`isSuccess`, `isError`).
- **Patrón Either/Resultado**: Manejo de errores funcional usando un tipo suma (`SmartFetchResult`) para éxito o error.
- **Sin dependencias externas**: Solo usa la API nativa `fetch` (disponible en Node 18+ y navegadores modernos).
- **Helpers funcionales**: `mapSuccess`, `mapError`, `chain` para composición de operaciones.

---

## Instalación

Puedes instalar SmartFetch fácilmente a través de NPM, escribiendo en la terminal de GitBash desde VS Code:
npm install smartfetch

---

## Requisitos

- **Node.js**: Versión 18 o superior (incluye fetch nativo).
- **TypeScript**: Versión 4.3 o superior (para soporte de tipos avanzados).
- **Navegadores**: Todos los navegadores modernos que soporten la API fetch y AbortController.

---

## Uso básico

- **Importaciones**
Importar funciones y tipos
import { smartFetch, get, post, isSuccess, isError } from 'smartfetch';

Opcional: importar tipos para mejor documentación
import type { SmartFetchOptions, SmartFetchResult, User } from 'smartfetch';

- **Petición GET CON TIMEOUT**
const result = await get<User>('https://jsonplaceholder.typicode.com/users/1', {
  timeout: 5000, // 5 segundos
});

if (isSuccess(result)) {
  console.log('Usuario:', result.value.data.name);
} else {
  console.error('Error:', result.error.message);
}

- **Petición POST CON CUERPO**
const newUser = { name: 'John Doe', email: 'john@example.com' };

const result = await post<User, typeof newUser>(
  'https://jsonplaceholder.typicode.com/users',
  newUser
);

if (isSuccess(result)) {
  console.log('Usuario creado con ID:', result.value.data.id);
} else {
  console.error('Error al crear:', result.error.message);
}

- **Petición con reintentos**
const result = await get('/api/endpoint-inestable', {
  retries: 3,          // 3 reintentos en caso de error 5xx
  timeout: 10000,      // 10 segundos de timeout
  backoffFactor: 2,    // Espera exponencial: 1s, 2s, 4s...
});

if (isSuccess(result)) {
  console.log('¡Éxito después de reintentos!');
}

---

## API completa

- **SmartFetch<T>(url, options)**
Función principal que realiza la petición HTTP.

Parámetro |	  Tipo            |   Descripción
url	      |   string	      | URL del recurso.
options	  | SmartFetchOptions |	Opciones de configuración (ver más abajo).

- **SmartFetchOptions**
Extiende las opciones de fetch (RequestInit), por lo que acepta method, headers, body, signal, etc.

Propiedad	   |    Tipo	   |             Descripción	                           |    Por defecto
timeout	       |   number	   |   Tiempo máximo de espera en ms.	                   |      30000
retries	       |   number	   |   Número de reintentos en errores 5xx.	               |        1
backoffFactor  |   number	   |   Factor de crecimiento exponencial entre reintentos. |	   1.5


- **Métodos HTTP (helpers)**
Función	                             |       Descripción
get<T>(url, options)	             | Petición GET.
post<T, B>(url, body, options)	     | Petición POST con cuerpo JSON.
put<T, B>(url, body, options)	     | Petición PUT (actualización completa).
patch<T, B>(url, body, options)	     | Petición PATCH (actualización parcial).
del<T>(url, options)	             | Petición DELETE.

- **Helpers funcionales (para SmartFetchResult)**
Función	               |                 Descripción
isSuccess(result)	   |   Type guard: verifica si el resultado es 'success'.
isError(result)	       |   Type guard: verifica si el resultado es 'error'.
getValue(result)	   |   Extrae los datos (T). Lanza error si es 'error'.
getError(result)	   |   Extrae el error. Lanza error si es 'success'.
mapSuccess(result, fn) |   Aplica una transformación al valor en caso de éxito.
mapError(result, fn)   |   Aplica una transformación al error en caso de error.
chain(result, fn)	   |   Encadena operaciones que pueden fallar (versión de flatMap/bind).

- **Manejo de errores (SmartFetchError)**
El tipo SmartFetchError es un tipo suma (discriminated union) que puede ser:
{ type: 'timeout'; message: string; timeout: number }
{ type: 'network'; message: string; cause?: Error }
{ type: 'http'; status: number; statusText: string; data?: any }
{ type: 'max-retries'; message: string; attempts: number }

Esto permite manejarlos de forma exhaustiva:

if (isError(result)) {
  switch (result.error.type) {
    case 'timeout':
      console.error(`Timeout de ${result.error.timeout}ms`);
      break;
    case 'http':
      console.error(`HTTP ${result.error.status}: ${result.error.statusText}`);
      break;
    case 'network':
      console.error(`Error de red: ${result.error.message}`);
      break;
    case 'max-retries':
      console.error(`Reintentos agotados (${result.error.attempts} intentos)`);
      break;
  }
}

---

## Ejemplo completo de integración

Puedes ver un ejemplo completo con todos los métodos y helpers en el archivo example.ts incluido en el repositorio.

Ejemplo: Obtener usuario y sus publicaciones
// example.ts (resumen)
import { get, post, chain, isSuccess, mapSuccess } from 'smartfetch';
import type { User, Post } from 'smartfetch';

async function main() {
  // 1. Obtener usuario
  const userResult = await get<User>('https://jsonplaceholder.typicode.com/users/1');
  
  if (isError(userResult)) {
    console.error('Error al obtener usuario:', userResult.error.message);
    return;
  }

  // 2. Transformar datos con mapSuccess
  const mapped = mapSuccess(userResult, (user) => ({
    ...user,
    name: user.name.toUpperCase()
  }));

  if (isSuccess(mapped)) {
    console.log(`Usuario: ${mapped.value.data.name}`);
  }

  // 3. Encadenar con chain para obtener publicaciones
  const postsResult = chain(userResult, async (user) => {
    return await get<Post[]>(`https://jsonplaceholder.typicode.com/posts?userId=${user.id}`);
  });

  if (isSuccess(postsResult)) {
    console.log(`El usuario tiene ${postsResult.value.data.length} publicaciones.`);
  } else {
    console.error('Error al obtener publicaciones:', postsResult.error.message);
  }
}

main();
Ejemplo: Crear un usuario
typescript
async function createUser() {
  const newUser = { name: 'Jane Doe', email: 'jane@example.com' };

  const result = await post<User, typeof newUser>(
    'https://jsonplaceholder.typicode.com/users',
    newUser
  );

  if (isSuccess(result)) {
    console.log('Usuario creado:', result.value.data);
  } else {
    console.error('Error al crear usuario:', result.error.message);
  }
}

createUser();

---

## Licencia
Este proyecto está bajo la licencia UCAB. Consulta el archivo LICENSE para más detalles.

---

## Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request en el repositorio de GitHub.

---

## Contacto
Si tienes preguntas o sugerencias, no dudes en contactar al autor a través del repositorio de GitHub.