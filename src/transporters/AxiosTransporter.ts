import { AxiosInstance } from 'axios';
import { compact, isNil, omitBy } from 'lodash';
import { Request, Transporter } from './Transporter';

export class AxiosTransporter<T = any> implements Transporter {
  constructor(private http: AxiosInstance) {}

  async execute(request: Request): Promise<T> {
    const url = compact([request.baseUrl, request.path, request.key, request.action])
      .map((element) => String(element).replace(/^\/|\/$/, ''))
      .join('/');

    const data = omitBy(request.data, isNil);

    try {
      const response = await this.http.request({
        url: url,
        method: request.method,
        headers: request.headers,
        params: request.params,
        responseType: request.blob ? 'blob' : undefined,
        data,
      });

      return request.wrap ? response.data[request.wrap] : response.data;
    } catch (error: any) {
      console.log(error.message);
      throw error;
    }
  }
}
