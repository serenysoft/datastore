import { isBoolean, isEmpty, isNil, omitBy } from 'lodash';

export type RequestHeaders = Record<string, string | number | boolean>;
export type RequestParams = Record<string, string | number | object | boolean>;
export type Transporter = (request: Request) => Promise<any>;

export interface Route {
  path?: string;
  method?: string;
  params?: RequestParams;
  headers?: RequestHeaders;
}

export interface Request extends Route {
  baseUrl?: string;
  url?: string;
  data?: any;
  key?: string | number;
  wrap?: string;
  action?: string;
  blob?: boolean;
}

export async function executeRequest(request: Request, transporter: Transporter): Promise<any> {
  const data = omitBy(request.data, isNil);
  const params = omitBy({ ...request, data }, (value) => !isBoolean(value) && isEmpty(value));

  const response = await transporter(params);

  return request.wrap ? response[request.wrap] : response;
}
