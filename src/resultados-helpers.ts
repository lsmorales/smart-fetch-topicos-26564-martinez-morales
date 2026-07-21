/** Helpers para trabajar con SmartFetchResult con either 
 * 
 * @module resultados-helpers
 * Aquí se proporcionan funciones utilitarias para manejar resultados de peticiones SmartFetch de forma funcional y segura.
 * Permite verificar, extraer, transformar y encadenar operaciones sobre resultados exitosos o erróneos.
*/

import { SmartFetchResult, SmartFetchSuccess, SmartFetchError } from './tipos';

/** Verificación del resultado exitoso 
 * 
 * Esta función actúa como un **type guard** de TypeScript: si retorna `true`, el compilador sabe que el resultado es del tipo
 * `{ kind: 'success'; value: SmartFetchSuccess<T> }`.
 * 
 * @template T - Tipo de datos del resultado.
 * @param {SmartFetchResult<T>} result - Resultado a verificar.
 * @returns {result is { kind: 'success'; value: SmartFetchSuccess<T> }} `true` si el resultado es exitoso, `false` en caso contrario.
*/
export function isSuccess<T>(result: SmartFetchResult<T>): result is { kind: 'success'; value: SmartFetchSuccess<T> } {
    return result.kind === 'success';
}

/** Verificación de si el resultado es erróneo 
 * 
 * Esta función actúa como un **type guard** de TypeScript: si retorna `true`, el compilador sabe que el resultado es del tipo
 * `{ kind: 'error'; error: SmartFetchError }`.
 * 
 * @template T - Tipo de datos del resultado (ignorado en caso de error).
 * @param {SmartFetchResult<T>} result - Resultado a verificar.
 * @returns {result is { kind: 'error'; error: SmartFetchError }} `true` si el resultado es erróneo, `false` en caso contrario.
*/
export function isError<T>(result: SmartFetchResult<T>): result is { kind: 'error'; error: SmartFetchError } {
    return result.kind === 'error';
}

/** Obtiene el mensaje de error a partir de un SmartFetchError 
 * 
 * Convierte cualquier tipo de error (`timeout`, `http`, `network`, `max-retries`) en un mensaje de texto descriptivo y consistente.
 * @param {SmartFetchError} error - Error a procesar.
 * @returns {string} Mensaje de error legible.
*/
export function getErrorMessage(error: SmartFetchError): string {
    switch (error.type){
        case 'timeout':
            return `Timeout: ${error.message}`;
        case 'http':
            return `HTTP ${error.status}: ${error.statusText}`;
        case 'network':
            return `Network error: ${error.message}`;
        case 'max-retries':
            return `Max retries exceeded: ${error.message}`;
        default:
            //Esto no debería pasar, pero por si acaso
            const _exhaustive: never = error;
            return 'Unknown error';
    }
}


/** Obtiene el valor de un resultado exitoso 
 * Si el resultado es exitoso, retorna los datos. 
 * Si es erróneo, lanza error con mensaje.
 * 
 * @template T - Tipo de datos del resultado.
 * @param {SmartFetchResult<T>} result - Resultado del cual extraer el valor.
 * @returns {T} Los datos del resultado exitoso.
 * @throws {Error} Si el resultado es erróneo.
 */
export function getValue<T>(result: SmartFetchResult<T>): T {
    if (result.kind === 'success') {
        return result.value.data;
    }
    throw new Error(`Cannot get value from error: ${getErrorMessage(result.error)}`);
}

/** Obtiene el error de un resultado erróneo
 * 
 * Si el resultado es erróneo, retorna el error (`SmartFetchError`).
 * Si es exitoso, lanza un error indicando que no hay error disponible.
 * 
 * @template T - Tipo de datos del resultado (ignorado en caso de error).
 * @param {SmartFetchResult<T>} result - Resultado del cual extraer el error.
 * @returns {SmartFetchError} El error del resultado erróneo.
 * @throws {Error} Si el resultado es exitoso.
 */
export function getError<T>(result: SmartFetchResult<T>): SmartFetchError {
    if (result.kind === 'error') {
        return result.error;
    }
    throw new Error('Cannot get error from successful result');
}

/** Función de transformación aplicada al valor obtenido si el resultado es exitoso 
 * 
 * Si el resultado es exitoso, aplica `fn` al valor `data` y devuelve un nuevo resultado exitoso con el valor transformado. Si es erróneo, lo propaga sin cambios.
 * 
 * @template T - Tipo de datos original.
 * @template U - Tipo de datos después de la transformación.
 * @param {SmartFetchResult<T>} result - Resultado a transformar.
 * @param {(value: T) => U} fn - Función de transformación.
 * @returns {SmartFetchResult<U>} Nuevo resultado con el valor transformado.
*/
export function mapSuccess<T, U>(
    result: SmartFetchResult<T>,
    fn: (value: T) => U
): SmartFetchResult<U>{
    if (result.kind === 'success'){
        return{
            kind: 'success',
            value: {
                ...result.value,
                data: fn(result.value.data),
            },
        };
    }
    return result as any;
}

/** Función de transformación aplicada al error si el resultado es erróneo 
 * 
 * Si el resultado es erróneo, aplica `fn` al error y devuelve un nuevo resultado erróneo con el error transformado. Si es exitoso, lo propaga sin cambios.
 * 
 * @template T - Tipo de datos del resultado (sin cambios).
 * @param {SmartFetchResult<T>} result - Resultado a transformar.
 * @param {(error: SmartFetchError) => SmartFetchError} fn - Función de transformación del error.
 * @returns {SmartFetchResult<T>} Nuevo resultado con el error transformado.
*/
export function mapError<T>(
    result: SmartFetchResult<T>,
    fn: (error: SmartFetchError) => SmartFetchError
): SmartFetchResult<T> {
    if (result.kind === 'error'){
        return{
            kind: 'error',
            error: fn(result.error),
        };
    }
    return result;
}

/** Encadenar operaciones que pueden fallar 
 * 
 * Si el resultado es exitoso, aplica `fn` al valor y retorna el nuevo resultado.
 * Si es erróneo, lo propaga sin ejecutar `fn`.
 * 
 * Esta función es útil para **componer operaciones secuenciales** donde cada paso puede fallar, sin necesidad de verificar manualmente el estado del resultado
 * en cada paso.
 * 
 * @template T - Tipo de datos original.
 * @template U - Tipo de datos del siguiente paso.
 * @param {SmartFetchResult<T>} result - Resultado inicial.
 * @param {(value: T) => SmartFetchResult<U>} fn - Función que retorna un nuevo resultado.
 * @returns {SmartFetchResult<U>} Resultado del siguiente paso o el error propagado.
*/
export function chain<T, U>(
    result: SmartFetchResult<T>,
    fn: (value: T) => SmartFetchResult<U>
): SmartFetchResult<U> {
    if (result.kind === 'success') {
        return fn(result.value.data);
    }
    return result;
}