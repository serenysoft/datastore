export type RequestHeaders = Record<string, string | number | boolean>;
export type RequestParams = {
  [key: string]: string | number | object | boolean;
};

export interface Route {
  path?: string;
  method?: string;
  params?: RequestParams;
  headers?: RequestHeaders;
}

export interface Request extends Route {
  data?: any;
  key?: string | number;
  wrap?: string;
  suffix?: string;
  link?: Record<string, string | number | boolean>;
}

export interface Transporter<R = any> {
  execute(request: Request): Promise<R>;
}
