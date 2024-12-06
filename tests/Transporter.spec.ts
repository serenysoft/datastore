import './Transporter.mock';
import axios, { AxiosInstance } from 'axios';
import { executeRequest, Request, Transporter } from '../src';
import { compact } from 'lodash';

describe('Transporter', () => {
  let http: AxiosInstance;
  let transporter: Transporter;

  beforeAll(() => {
    global.FormData = jest.fn();

    http = axios.create({
      baseURL: 'http://api.fake.test',
    });

    transporter = async (request: Request) => {
      const url = compact([request.baseUrl, request.path, request.key, request.action])
        .map((element) => String(element).replace(/^\/|\/$/, ''))
        .join('/');

      const response = await http.request({
        url,
        method: request.method,
        headers: request.headers as any,
        params: request.params,
        data: request.data,
        responseType: request.blob ? 'blob' : undefined,
      });

      return response.data;
    };
  });

  it('should execute request', async () => {
    const response = await executeRequest(
      {
        path: '/contacts',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      transporter,
    );

    expect(Array.isArray(response)).toBe(true);
  });

  it('should omit nil values from request data', async () => {
    const data: any = {
      id: 'abcdef',
      name: 'jeff',
      last_name: null,
    };

    const request = jest.spyOn(http, 'request').mockReturnValue(Promise.resolve({}));

    await executeRequest(
      {
        path: '/users',
        method: 'POST',
        data: data,
      },
      transporter,
    );

    expect(request).toHaveBeenCalledWith({
      data: {
        id: 'abcdef',
        name: 'jeff',
      },
      method: 'POST',
      url: 'users',
      headers: undefined,
      params: undefined,
    });
  });
});
