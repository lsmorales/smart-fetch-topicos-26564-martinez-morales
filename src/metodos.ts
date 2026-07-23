/**
 * Helpers para metodos HTTP
 */

import { smartFetch } from "./index";
import { SmartFetchOptions, SmartFetchResult } from "./tipos";

/**
 * Petición HTTP GET
 * 
 * @template T - Tipo de datos esperado en la respuesta
 * @param {string} url - URL del recurso a consultar
 * @param {SmartFetchOptions} [options] - timeout, headers, lo demás
 * @returns {Promise<SmartFetchResult<T>>} - Promesa con el resultado
 */

export function get<T = any>(
    url: string,
    option?: SmartFetchOptions
): Promise<SmartFetchResult<T>>{
    return smartFetch<T>(url, { ...option, method: 'GET' });
}

/**
 * Petición HTTP POST con cuerpo en formato JSON
 * 
 * @template T - tipo de datos esperado en la respuesta
 * @template B - tipo del cuerpo de la petición (el objeto a enviar)
 * @param {string} url - url del recurso adonde se envían los datos
 * @param {B} body - Cuerpo de la petición que pasa a ser json automáticamente
 * @param {SmartFetchOptions} [options] - Timeout, header, etc
 * @returns {Promise<SmartFetchResult<T>>} - Promesa cumplida (con el resultado)
 */
export function post<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>>{
    return smartFetch<T>(url, {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {})},
        body: JSON.stringify(body),
    });
}

/**
 * Petición HTTP PUT
 * 
 * @template T - Tipo de dato esperado en la respuesta
 * @template B - Tipo del cuerpo de la petición
 * @param {string} url - URL del recurso a actualizar
 * @param {B} body - Cuerpo de la petición que se va aserializar a JSON
 * @param {SmartFetchOptions} [options] - Opciones adicionales
 * @returns {Promise<SmartFetchResult<T>>} - Promesa cumplida/con el resultado.
 */

export function put<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>>{
    return smartFetch<T>(url, {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {})},
        body: JSON. stringify(body),
    });
}

/**
 * Petición HTTP PATCH con cuerpo en JSON
 * 
 * @template T - Tipo de datos esperado en la respuesta
 * @template B - Tipo del cuerpo de la petición
 * @param {string} url - URL del recurso a actualizar parcialmente
 * @param {B} body - Cuerpo de la petición (se serializa a JSON)
 * @param {SmartFetchOptions} [options] - opciones adicionales
 * @returns {Promise<SmartFetchResult<T>>} - Promesa cumplida (con el resultado)
 */

export function patch<T = any, B = any>(
    url: string,
    body: B,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>>{
    return smartFetch<T>(url, {
        ...options,
        method: 'PATCH',
        headers: {'Content-Type': 'application/json', ...(options?.headers || {})},
        body: JSON.stringify(body),
    });
}

/**
 * Petición HTTP DELETE
 * 
 * @template T - Tipo de dato esperado en la respuesta
 * @param {string} url - URL del recurso a eliminar
 * @param {SmartFetchOptions} [options] - Opciones adicionales
 * @returns {Promise<SmartFetchResult<T>>} - Promesa cumplida (con el resultado)
 */

export function del<T = any>(
    url: string,
    options?: SmartFetchOptions
): Promise<SmartFetchResult<T>>{
    return smartFetch<T>(url, {
        ...options,
        method: 'DELETE',
    });
}