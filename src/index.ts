/** Cliente HTTP con timeout, reintentos y manejo de errores */
import { SmartFetchOptions, SmartFetchSuccess, SmartFetchError, SmartFetchResult } from './tipos';

/** Opciones por defecto */
const defaultOptions = {
  timeout: 30000, // 30 segundos
  retries: 1, // 1 reintento por defecto
  backoffFactor: 1.5, // Factor backoff exponencial
} as const;

/** Creación de una promesa que se rechaza después de un tiempo límite */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject({ type: 'timeout', message: `Request timed out after ${timeoutMs} ms`, timeout: timeoutMs });
        }, timeoutMs);
    });
}

/** Verificación de si un error es recuperable (para reintentos) */
function isRetryableError(error: unknown): boolean {
    //Errores de red (fetch falla) o errores 5xx
    if (error instanceof Error) {
        //Errores de red típicos
        if (error.message.includes('fetch') || error.message.includes('network')) {
            return true;
        }
    }
    //Si es error HTTP, se reintenta en 5xx
    if (typeof error === 'object' && error !== null && 'status' in error){
        const status = (error as any).status;
        return status >= 500 && status < 600;
    }
    return false;
}

/** Cálculo del tiempo de espera para el siguiente reintento (backoff exponencial) */
function calculateBackoff(attempt: number, baseDelay: number = 1000, factor: number = 1.5): number {
    return Math.min(baseDelay * Math.pow(factor, attempt), 30000);
}

/** Hace petición HTTP con timeout, reintentos y backoff exponencial. Manejo de reintentos 
 * 
 * @template T - Tipo de datos esperado en la respuesta.
 * @param {string} url - URL del recurso a consultar.
 * @paramm {SmartFetchOptions} [options] - Opciones de configuración (timeout, reintentos, header, lo demás)
 * @returns {Promise<SmartFetchResult<T>>} - Promesa que resuelve con un resultado de éxito o error.
*/
export async function smartFetch<T = any>(
    url: string,
    options: SmartFetchOptions = {}   
): Promise<SmartFetchResult<T>> {
    //Combinar opciones con valores por defecto
    const config = {
        timeout: options.timeout ?? defaultOptions.timeout,
        retries: options.retries ?? defaultOptions.retries,
        backoffFactor: options.backoffFactor ?? defaultOptions.backoffFactor,
    };

    let lastError: unknown = null;
    let attempt = 0;

    while (attempt <= config.retries){
        try{
            //Creación de un controlador de aborto para cancelar la petición en timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            //Hace la petición fetch con señal de abort
            const fetchPromise = fetch(url,{
                ...options,
                headers: {
                    ...(options.headers || {}),
                },
                signal: controller.signal,
            });

            //Competencia entre fetch y timeout
            const response = await Promise.race([
                fetchPromise,
                createTimeoutPromise(config.timeout),
            ]) as Response;

            clearTimeout(timeoutId);

            //Verificación de si la respuesta es OK (status 2xx)
            if (!response.ok){
                //Trata de leer el cuerpo del error
                let errorData: any = undefined;
                try{
                    errorData = await response.json();
                } catch{
                    //Si no se puede parsear, se ignora
                }

                const httpError: SmartFetchError = {
                    type: 'http',
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData,
                };

                //Si es error 5xx y quedan reintentos, se continúa
                if (response.status >= 500){
                    //Si quedan reintentos, se reintenta
                    if (attempt < config.retries){
                        lastError = httpError;
                        attempt++;
                        //Esperar backoff antes de reintentar
                        const delay = calculateBackoff(attempt);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    } else {
                        //no quedan reintentos, se sale del bucle y que devuelva el max-retries
                        break;
                    }
                }
                //Si no es 5xx (como 4xx), se devuelve error http directamente
                return { kind: 'error', error: httpError };
            }

            //Intentar parsear el cuerpo según el tipo de contenido
            let data: T;
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')){
                data = await response.json() as T;
            } else if (contentType.includes('text/')){
                data = (await response.text()) as any as T;
            } else{
                //Intentar JSON por defecto
                try{
                    data = await response.json() as T;
                } catch{
                    //Si falla, se usa texto
                    data = (await response.text()) as any as T;
                }
            }

            //Éxito
            const success: SmartFetchSuccess<T> = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            };

            return { kind: 'success', value: success };

            } catch (error){
                //Verificación de si es un error de timeout (abort)
                if (error && typeof error === 'object' && 'type' in error && (error as any).type === 'timeout'){
                    return { kind: 'error', error: error as SmartFetchError };
                }

                //Error de red u otro
                lastError = error;

                //Si es un error recuperable y quedan reintentos
                if (isRetryableError(error) && attempt < config.retries){
                    attempt++;
                    const delay = calculateBackoff(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                //Si es el error es no recuperable o ya no quedan reintentos
                const networkError: SmartFetchError = {
                    type: 'network',
                    message: error instanceof Error ? error.message : 'Network error',
                    cause: error instanceof Error ? error : undefined,
                };

                return { kind: 'error', error: networkError };
            }
        }

        //Si ya no quedan reintentos
        return {
            kind: 'error',
            error: {
                type: 'max-retries',
                message: `Failed after ${config.retries + 1} attempts`,
                attempts: config.retries + 1,
            }
        };
    }