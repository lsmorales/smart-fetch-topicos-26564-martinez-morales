// Tipos base para SmartFetch

/**
 * Opciones de configuración para la petición.
 * Extiende las opciones nativas de fetch (RequestInit) agregando parámetros extra.
 */
export interface SmartFetchOptions extends RequestInit {
    // Tiempo máximo de espera en milisegundos
    timeout?: number;
    // Cantidad máxima de reintentos para errores 5xx
    retries?: number;
    // Factor multiplicador para el tiempo de espera entre reintentos
    backoffFactor?: number;
}

/**
 * Estructura de una respuesta HTTP
 */
export interface SmartFetchSuccess<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
}

/**
 * posibles errores de la libreria y se usa type pa saber el tipo de error

 */
export type SmartFetchError =
    // Cuando la petición tarda demasiado
    | { type: 'timeout'; message: string; timeout: number }
    // Errores de red (sin conexión, DNS fallido, etc.)
    | { type: 'network'; message: string; cause?: Error }
    // La petición llegó, pero el servidor devolvió un error (ej. 404, 500)
    | { type: 'http'; status: number; statusText: string; data?: any }
    // Se acabaron los intentos de reconexión
    | { type: 'max-retries'; message: string; attempts: number };

/**
 * El resultado final de usar SmartFetch.
 * usa kind para saber si todo salio bien o hubo un error.
 */
export type SmartFetchResult<T> =
    | { kind: 'success'; value: SmartFetchSuccess<T> }
    | { kind: 'error'; error: SmartFetchError };

/**
 * Funcion encargada de procesar el body de la respuesta (ej: response.json())
 */
export type ResponseBodyParser<T> = (response: Response) => Promise<T>;