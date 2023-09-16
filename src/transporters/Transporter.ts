export type RequestHeaders = Record<string, string | number | boolean>;
export type RequestParams = Record<string, string | number | object | boolean>;

export interface Route {
  path?: string;
  method?: string;
  params?: RequestParams;
  headers?: RequestHeaders;
}

export interface Request extends Route {
  baseUrl?: string;
  data?: any;
  key?: string | number;
  wrap?: string;
  action?: string;
  blob?: boolean;
}

export interface Transporter<R = any> {
  execute(request: Request): Promise<R>;
}
