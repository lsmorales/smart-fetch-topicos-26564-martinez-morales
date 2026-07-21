/** Helpers para métodos de HTTP */

import { smartFetch } from './index';
import { SmartFetchOptions, SmartFetchSuccess, SmartFetchError, SmartFetchResult } from './tipos';

/** Petición HTTP GET
 * 
 * @template T - Tipo de datos esperado en la respuesta.
 * @param {string} url - URL del recurso a consultar.
 * @param {SmartFetchOptions} [options] - Opciones adicionales (timeout, headers, el resto).
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado.
 */
export function get<T = any>(
    url: string,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
    return smartFetch<T>(url, { ...options, method: 'GET'});
}

/** Petición POST con cuerpo en formato JSON 
 * 
 * @template T - tipo de datos esperado en la respuesta.
 * @template B - tipo del cuerpo de la petición (el objeto a enviar)
 * @param {string} url - URL del recurso del que enviar los datos.
 * @param {B} body - Cuerpo de la petición (se va a convertir en formato JSON automáticamente).
 * @param {SmartFetchOptions} [options] - Opciones adicionales (timeout, headers, el resto).
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado.
*/
export function post<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
    return smartFetch<T>(url, {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });  
}

/** Petición HTTP PUT con cuerpo en formato JSON
 * 
 * @template T - Tipo de datos esperado en la respuesta.
 * @template B - Tipo del cuerpo de la petición (el objeto a enviar).
 * @param {string} url - URL del recurso a actualizar.
 * @param {B} body - Cuerpo de la petición (se serializará a JSON automáticamente).
 * @param {SmartFetchOptions} [options] - Opciones adicionales (timeout, headers, el resto).
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado.
*/
export function put<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
    return smartFetch<T>(url, {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });
}

/** Petición HTTP PATCH con cuerpo en formato JSON
 * 
 * @template T - Tipo de datos esperado en la respuesta.
 * @template B - Tipo del cuerpo de la petición (el objeto a enviar).
 * @param {string} url - URL del recurso a actualizar parcialmente.
 * @param {B} body - Cuerpo de la petición (se serializará a JSON automáticamente).
 * @param {SmartFetchOptions} [options] - Opciones adicionales (timeout, headers, el resto).
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado.
 */
export function patch<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
    return smartFetch<T>(url, {
        ...options,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        body: JSON.stringify(body),
    });
}

/** Petición HTTP DELETE
 *  
 * @template T - Tipo de datos esperado en la respuesta (normalmente vacío o un mensaje de confirmación).
 * @param {string} url - URL del recurso a eliminar.
 * @param {SmartFetchOptions} [options] - Opciones adicionales (timeout, headers, los demás).
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado.
*/
export function del<T = any, B = any>(
    url: string,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>> {
    return smartFetch<T>(url, {
        ...options,
        method: 'DELETE',
    });
}

