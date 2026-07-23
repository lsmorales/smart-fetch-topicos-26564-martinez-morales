/**
 * Helpers para trabajar con SmartFecthResult con el patrón either
 * 
 * @module resultados-helpers
 * Funciones utilitarias que manejan resultados de peticiones SmartFetch de forma funcional y segura
 * Permiten verificar, extraer, transformar y encadenar operaciones sobre resultados exitosos o erróneos
 */

import { SmartFetchResult, SmartFetchSuccess, SmartFetchError } from './tipos';

/**
 * Verifica si el resultado es exitoso 
 * @template T - Tipo de dato del resultaod
 * @param {SmartFetchResult<T>} result - Resultado que tiene que verificarse
 * @returns true si el resultado es exitoso
 */

export function isSuccess<T>(result: SmartFetchResult<T>): result is { kind: 'success'; value: SmartFetchSuccess<T> }{
    return result.kind === 'success';
}

/**
 * Verifica si el resultado es erróneo
 * 
 * @template T - Tipo de dato del resultado
 * @param {SmartFetchResult<T>} result - Resultado que va a verificarse
 * @returns true si el resultado es erróneo
 */

export function isError<T>(result: SmartFetchResult<T>): result is { kind: 'error'; error: SmartFetchError }{
    return result.kind === 'error';
}

/**
 * Obtención de mensaje de texto a partir de SmartFetchError
 * 
 * @param {SmartFetchError} error - Error a procesar
 * @returns {string} un mensaje legible, que se lee
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
            //Añadir un nuevo tipo de error, el typescript marca error
            const _exhaustive: never = error;
            return 'Unknown error';
    }
}

/**
 * Extrae datos de resultados exitosos, lanza error si el resultado es erróneo
 * 
 * @template T - Tipo de datos del resultado
 * @param {SmartFetchResult<T>} result - Resultado
 * @returns {T} los datos del resultado
 * @throws {Error} si el resultado es erróneo
*/

export function getValue<T>(result: SmartFetchResult<T>): T {
    if (result.kind === 'success'){
        return result.value.data;
    }
    throw new Error(`No se puede conseguir el valor desde el error: ${getErrorMessage(result.error)}`);
}

/**
 * Extrae el error de un resultado erróneo, lanza error si es resultado exitoso
 * 
 * @template T - Tipo de datos del resultado
 * @param { SmartFetchResult<T> } result -  resultado
 * @returns {SmartFetchError} el error 
 * @throws {Error} Si el resultado es exitoso
 */

export function getError<T>(result: SmartFetchResult<T>): SmartFetchError{
    if (result.kind === 'error'){
        return result.error;
    }
    throw new Error('No se puede conseguir el valor desde el error')
}

/**
 * Transforma el valor si el resultado es exitoso con el map
 * 
 * @template T - Tipo original
 * @template U - Tipo transformado
 * @param {SmartFetchResult<T>} result - Resultado a transformar
 * @param {(value: T) => U} fn - Función de transformación
 * @returns {SmartFetchResult<U>} Nuevo resultado con el valor transformado
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
    return result as SmartFetchResult<U>;
}

/**
 * Transforma el error si el resultado es erróneo
 * 
 * @template T - Tipo de datos sin cambios
 * @param {SmartFetchResult<T>} result - Resultado que se transformará
 * @param {(error: SmartFetchError) => SmartFetchError} fn - Transformación del error
 * @returns {SmartFetchResult<T>} Nuevo resultado con el error transformado
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

/**
 * Encadena operaciones que pueden fallar con flatMap y bind
 * 
 * Si el resultado es exitoso, se aplica fn al valor y retorna el nuevo resultado
 * Si el resultado es erróneo, se propaga el error sin ejecutar fn.
 * 
 * @template T - Tipo original
 * @template U - Tipo del siguiente paso
 * @param {SmartFetchResult<T>} result - Resultado inicial
 * @param {(value: T) => SmartFetchResult<U>} fn - Función que retorna nuevo resultado
 * @returns {SmartFetchResult<U>} resultado del siguiente paso o el error propagado
 */
export function chain<T, U>(
    result: SmartFetchResult<T>,
    fn: (value: T) => SmartFetchResult<U>
): SmartFetchResult<U>{
    if (result.kind === 'success'){
        return fn(result.value.data);
    }
    return result;
}