export type RequestHeaders = Record<string, string | number | boolean>;
export type RequestParams = {
  [key: string]: string | number | object | boolean;
};

export interface Request {
  path?: string;
  method?: string;
  params?: RequestParams;
  headers?: RequestHeaders;
  data?: any;
  key?: string | number;
  wrap?: string;
  suffix?: string;
  link?: Record<string, string | number | boolean>;
}

export interface Transporter<R = any> {
  execute(request: Request): Promise<R>;
}
