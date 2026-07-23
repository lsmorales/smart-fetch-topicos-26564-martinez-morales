import {smartFetch} from '../src/index';
import {get, post} from '../src/metodos';
import {isSuccess, isError, mapSuccess} from '../src/resultados-helpers';

//Mock de fetch global
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as any;

describe('SmartFetch', () => {
    beforeEach(()=>{
        jest.clearAllMocks();
    });

    describe('Casos de éxito', () => {
        it('debería hacer una petición GET y retornar los datos', async () =>{
            const mockData = {id: 1, name: 'Test'};
            mockFetch.mockResolvedValueOnce({
                ok:true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({'content-type': 'application/json'}),
                json: jest.fn().mockResolvedValue(mockData),
            });
            
            const result = await get('/api/test');

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)){
                expect(result.value.data).toEqual(mockData);
                expect(result.value.status).toBe(200);
            }
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({method: 'GET'})
            );
        });
        it ('debería hacer petición POST con cuerpo', async ()=>{
            const body = {name: 'New item'};
            const mockResponse = {id: 1, name: 'New item'};

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                statusText: 'Creado',
                headers: new Headers({'content-type': 'application/json'}),
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const result = await post('/api/items', body);

            expect(isSuccess(result)).toBe(true);
            if (isSuccess(result)){
                expect(result.value.data).toEqual(mockResponse);
                expect(result.value.status).toBe(201);
            }
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/items',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                })
            );
        });
    });

    describe('Manejo de errores', ()=>{
        it('debería manejar errores HTTP 4xx', async()=>{
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not found',
                headers: new Headers(),
                json:jest.fn().mockResolvedValue({message: 'Resource not found'}),
            });

            const result = await get('/api/notfound');

            expect(isError(result)).toBe(true);
            if (isError(result)){
                expect(result.error.type).toBe('http');
                if (result.error.type === 'http'){
                    expect(result.error.status).toBe(404);
                    expect(result.error.data).toEqual({message: 'Resource not found'});
                }
            }
        });

        it('debería manejar errores de red', async()=>{
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await get('/api/test');

            expect(isError(result)).toBe(true);
            if (isError(result)){
                expect(result.error.type).toBe('network');
                if(result.error.type === 'network'){
                    expect(result.error.message).toContain('Network error');
                }
            }
        });

        it('debería manejar timeout', async()=>{
            //Simula petición que no responde
            mockFetch.mockImplementationOnce(()=> new Promise(()=>{}));

            const result = await smartFetch('/api/slow', {timeout:10});

            expect(isError(result)).toBe(true);
            if (isError(result)){
                expect(result.error.type).toBe('timeout');
                if (result.error.type === 'timeout'){
                    expect(result.error.timeout).toBe(10);
                }
            }
        });
    });

    describe('Reintentos', ()=>{
        it('debería reintentar en error 5xx', async ()=>{
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'internal Server Error',
                headers: new Headers(),
                json: jest.fn().mockResolvedValue({}),
            });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({'content-type': 'application/json'}),
                json: jest.fn().mockResolvedValue({success: true}),
            });

            const result = await get('/api/retry', {retries: 2});

            expect(isSuccess(result)).toBe(true);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('debería fallar cuando no queden reintentos', async()=>{
            for (let i=0; i<3; i++){
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    headers: new Headers(),
                    json: jest.fn().mockResolvedValue({}),
                });
            }

            const result = await get('/api/retry', {retries: 2});

            expect(isError(result)).toBe(true);
            if (isError(result)){
                expect(result.error.type).toBe('max-retries');
                if (result.error.type === 'max-retries'){
                    expect(result.error.attempts).toBe(3);
                }
            }
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });
    });

    describe('Helpers de resultados', ()=>{
        it('debería aplicar el mapSuccess bien', async()=>{
            const mockData = {id: 1, name: 'Test'};
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({'content-type': 'application/json'}),
                json: jest.fn().mockResolvedValue(mockData),
            });

            const result = await get('/api/test');
            const mapped = mapSuccess(result, (data: any)=>({
                ...data,
                name: data.name.toUpperCase(),
            }));

            expect(isSuccess(mapped)).toBe(true);
            if (isSuccess(mapped)){
                expect(mapped.value.data.name).toBe('TEST');
            }
        });
    });
})
