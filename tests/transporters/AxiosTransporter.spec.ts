import { AxiosTransporter } from '../../src/transporters/AxiosTransporter';
import axios from 'axios';
import './AxiosTransporter.mock';

describe('Axios Provider', () => {
  beforeAll(() => {
    global.FormData = jest.fn();
  });

  it('should execute request', async () => {
    const http = axios.create({
      baseURL: 'http://api.fake.test',
    });

    const provider = new AxiosTransporter(http);
    const response = await provider.execute({
      path: '/contacts',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(Array.isArray(response)).toBe(true);
  });

  it('should execute request with wrap', async () => {
    const http = axios.create({
      baseURL: 'http://api.fake.test',
    });

    const provider = new AxiosTransporter(http);
    const response = await provider.execute({
      path: '/contacts/wrap',
      method: 'POST',
      wrap: 'data',
      data: { name: 'Jeff' },
    });

    expect(response).not.toHaveProperty('data');
    expect(response).toHaveProperty('name');
  });

  it('should omit nil values from request data', async () => {
    const data: any = {
      id: 'abcdef',
      name: 'jeff',
      last_name: null,
    };

    const http = axios.create();
    const provider = new AxiosTransporter(http);

    const request = jest
      .spyOn(http, 'request')
      .mockReturnValue(Promise.resolve({}));

    await provider.execute({
      path: '/users',
      method: 'POST',
      data: data,
    });

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

  it.skip('should replace macros in url', async () => {
    const http = axios.create();
    const provider = new AxiosTransporter(http);

    const request = jest
      .spyOn(http, 'request')
      .mockReturnValue(Promise.resolve({}));

    await provider.execute({
      path: '/users/{user}/permissions',
      method: 'GET',
      link: { user: 1 },
    });

    expect(request).toHaveBeenCalledWith({
      url: 'users/1/permissions',
      data: {},
      headers: undefined,
      method: 'GET',
      params: undefined,
    });
  });
});
