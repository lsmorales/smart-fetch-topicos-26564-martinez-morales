/** Tipos base para SmartFetch
 * 
 * @module tipos
 * Aquí están todas las definiciones de tipos e interfaces utilizados por la librería SmartFetch
*/

/** Opciones de configuración para una petición SmartFetch 
 * 
 * Extiende las opciones nativas de `fetch` (RequestInit) para soportar todas las funcionalidades estándar, además de las opciones personalizadas.
 * 
 * @interface SmartFetchOptions
 * @extends {RequestInit}
 * 
 * @property {number} [timeout] - Tiempo máximo de espera en milisegundos. Por defecto: 30000 (30 segundos).
 * @property {number} [retries] - Número máximo de reintentos en caso de errores 5xx. Por defecto: 1.
 * @property {number} [backoffFactor] - Factor de backoff exponencial entre reintentos. Por defecto: 1.5.
*/

export interface SmartFetchOptions extends RequestInit{
    /**Tiempo máximo de espera en milisegundos */
    timeout?: number;
    /**Número máximo de reintentos */
    retries?: number;
    /** factor de backoff para reintentos */
    backoffFactor?: number;
}

/** Respuesta exitosa de SmartFetch 
 * 
 * @template T - Tipo de los datos contenidos en la respuesta.
 * 
 * @interface SmartFetchSuccess
 * @property {T} data - Datos deserializados de la respuesta (JSON, texto, etc.).
 * @property {number} status - Código de estado HTTP (ej. 200, 201).
 * @property {string} statusText - Texto del estado HTTP (ej. "OK", "Created").
 * @property {Headers} headers - Cabeceras de la respuesta.
*/
export interface SmartFetchSuccess<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
}

/** Error de SmartFetch 
 * Tipo que representa un error ocurrido durante una petición Smartfetch.
 * 
 * Utiliza un **tipo suma (discriminated union)** para representar diferentes tipos de errores con propiedades específicas según el caso.
 * 
 * @typedef {Object} SmartFetchError
 * @property {string} type - Identificador del tipo de error.
 * 
 * Los tipos posibles son:
 * - **`'timeout'`**: Ocurre cuando la petición excede el tiempo límite.
 *   - `message`: string - Descripción del timeout.
 *   - `timeout`: number - Tiempo límite en milisegundos.
 * 
 * - **`'network'`**: Ocurre cuando hay un error de red (fetch falla).
 *   - `message`: string - Descripción del error de red.
 *   - `cause?`: Error - Error original que causó el fallo.
 * 
 * - **`'http'`**: Ocurre cuando la respuesta HTTP tiene un código de error (4xx, 5xx).
 *   - `status`: number - Código de estado HTTP.
 *   - `statusText`: string - Texto del estado HTTP.
 *   - `data?`: any - Cuerpo del error (si existe y es parseable).
 * 
 * - **`'max-retries'`**: Ocurre cuando se agotan los reintentos permitidos.
 *   - `message`: string - Descripción del agotamiento.
 *   - `attempts`: number - Número total de intentos realizados.
*/
export type SmartFetchError =
    | { type: 'timeout'; message: string; timeout: number }
    | { type: 'network'; message: string; cause?: Error }
    | { type: 'http'; status: number; statusText: string; data?: any }
    | { type: 'max-retries'; message: string; attempts: number };

/** Resultado de una petición: éxito o error
 * 
 * Utiliza un **tipo suma (discriminated union)** para representar de forma segura que una petición puede resultar en éxito (`kind: 'success'`)
 * o en error (`kind: 'error'`). Esto permite manejar ambos casos de manera tipada y exhaustiva.
 * 
 * @template T - Tipo de los datos en caso de éxito.
 * 
 * @typedef {Object} SmartFetchResult
 * @property {string} kind - Discriminador: `'success'` o `'error'`.
 * 
 * - **`{ kind: 'success'; value: SmartFetchSuccess<T> }`**: es el resultado exitoso con los datos y metadatos de la respuesta.
 * 
 * - **`{ kind: 'error'; error: SmartFetchError }`**: es el resultado erróneo con la información del error ocurrido.
*/
export type SmartFetchResult<T> =
    | { kind: 'success'; value: SmartFetchSuccess<T> }
    | { kind: 'error'; error: SmartFetchError };

/**
 * Función que proceso el cuerpo de la respuesta
 * 
 * Este tipo define una función que toma una respuesta `Response` y devuelve una promesa con el cuerpo parseado al tipo `T`.
 * 
 * @template T - Tipo de datos resultante del parseo.
 * 
 * @param {Response} response - Objeto Response de la API fetch.
 * @returns {Promise<T>} - Promesa con los datos parseados.
*/
export type ResponseBodyParser<T> = (response: Response) => Promise<T>;