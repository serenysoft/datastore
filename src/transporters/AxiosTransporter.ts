import { AxiosInstance } from 'axios';
import { isNil, isPlainObject, omitBy } from 'lodash';
import { Request, Transporter } from './Transporter';

export class AxiosTransporter<T = any> implements Transporter {
  constructor(private http: AxiosInstance) {}

  async execute(request: Request): Promise<T> {
    const url = [request.path, request.key, request.suffix]
      .filter((element) => !isNil(element))
      .map((element) => element.toString().replace(/^\/|\/$/, ''))
      .join('/');

    const data = isPlainObject(request)
      ? request.data
      : omitBy(request.data, isNil);

    try {
      const response = await this.http.request({
        url: url,
        method: request.method,
        headers: request.headers,
        params: request.params,
        data: data,
      });

      return request.wrap ? response.data[request.wrap] : response.data;
    } catch (error: any) {
      console.log(error.message);
      throw error;
    }
  }
}
