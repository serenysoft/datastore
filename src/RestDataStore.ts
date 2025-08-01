import { isEmpty, isNil, isPlainObject, merge, omitBy } from 'lodash';
import { DataStore, DataStoreOptions, FindResult, LinkParams, MediaParams } from './DataStore';
import { FindOptions } from './DataStore';
import { Transformer } from './transformers/Transformer';
import { executeRequest, Request, Transporter } from './Transporter';

export type ModifierCallback = (data: any) => any;

export interface RestRequest extends Request {
  baseUrl?: string;
}

export interface RestRoutes {
  index?: RestRequest;
  create?: RestRequest;
  update?: RestRequest;
  remove?: RestRequest;
  restore?: RestRequest;
  validate?: RestRequest;
  show?: RestRequest;
  upload?: RestRequest;
  download?: RestRequest;
}

export interface RestParamNames {
  page?: string;
  limit?: string;
  sort?: string;
  query?: string;
  filter?: string | false;
}

export interface RestDataStoreOptions extends DataStoreOptions {
  key?: string;
  baseUrl?: string;
  headers?: object;
  routes?: RestRoutes;
  paramNames?: RestParamNames;
  wrap?: string;
  modifier?: ModifierCallback;
  transporter: Transporter;
}

export abstract class RestDataStore<O extends RestDataStoreOptions, T = any>
  implements DataStore<T>
{
  private linkParams: LinkParams = {};
  private readonly macro = /\{(\w+)\}/;

  constructor(protected options: O) {}

  key(): string {
    return this.options.key;
  }

  link(params: LinkParams): void {
    this.linkParams = params;
  }

  async findOne(key: string): Promise<T> {
    if (this.hasInvalidLink()) {
      throw new Error('The link data must be set');
    }

    const request = merge(
      {
        method: 'GET',
        key: key,
        wrap: this.options.wrap,
      },
      this.options.routes?.show,
    );

    const result = await this.execute(request);

    if (Array.isArray(result)) {
      return result.length ? result[0] : null;
    }

    return result;
  }

  async findAll(options?: FindOptions): Promise<FindResult<T>> {
    if (this.hasInvalidLink()) {
      return { data: [], totalCount: 0 };
    }

    const transformer = this.createTransformer();
    const route = transformer.execute(options);
    const request = merge(
      {
        method: 'GET',
        wrap: this.options.wrap,
      },
      route,
      this.options.routes?.index,
    );

    return await this.execute(request, true);
  }

  async exists(condition: any[]): Promise<boolean> {
    const result = await this.findAll({
      filter: condition,
    });
    return !!result.data.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async count(condition: any): Promise<number> {
    throw new Error('Feature not supported.');
  }

  async insert(data: T): Promise<any> {
    const result = await this.execute({
      method: 'POST',
      data: data,
      wrap: this.options.wrap,
      ...this.options.routes?.create,
    });

    return result;
  }

  async update(data: T): Promise<any> {
    const key = (data as any)[this.options.key];

    return await this.execute({
      key,
      method: 'PUT',
      data: data,
      wrap: this.options.wrap,
      ...this.options.routes?.update,
    });
  }

  async remove(key: string, force?: boolean): Promise<void> {
    await this.execute({
      method: 'DELETE',
      key: key,
      params: { force: force },
      ...this.options.routes?.remove,
    });
  }

  async restore(key: string): Promise<void> {
    await this.execute({
      method: 'POST',
      path: 'restore',
      key: key,
      ...this.options.routes?.restore,
    });
  }

  async validate(data: T): Promise<any> {
    const result = await this.execute({
      method: 'POST',
      path: 'validate',
      data: data,
      ...this.options.routes?.validate,
    });

    return result;
  }

  async upload(params: MediaParams): Promise<any> {
    const result = await this.execute({
      method: 'POST',
      data: params,
      blob: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...this.options.routes?.upload,
    });

    return result;
  }

  async download(key: string): Promise<Blob> {
    const result = await this.execute({
      method: 'GET',
      path: key,
      blob: true,
      ...this.options.routes?.download,
    });

    return result;
  }

  async execute(route: Request, totalCount?: boolean): Promise<any> {
    const request = {
      baseUrl: this.formatMacro(this.options.baseUrl),
      ...route,
      path: this.formatMacro(route.path),
      action: this.formatMacro(route.action),
      params: omitBy(route.params, isNil),
    };

    if (isEmpty(request.params)) {
      delete request.params;
    }

    if (isPlainObject(request.data) && this.options.modifier) {
      request.data = this.options.modifier(request.data);
    }

    const response = await executeRequest(request, this.options.transporter);

    const result = request.wrap ? response[request.wrap] : response;

    return totalCount
      ? {
          data: result,
          totalCount: this.parseTotalCount(response),
        }
      : result;
  }

  protected formatMacro(text: string): string {
    if (!text) {
      return text;
    }

    return text.replace(this.macro, (match, key) => {
      const value = this.linkParams[key] as string;
      return value || '';
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected parseTotalCount(response: any): number {
    return null;
  }

  protected hasInvalidLink(): boolean {
    const { baseUrl, routes } = this.options;
    const params = this.linkParams || {};

    const urls = [
      baseUrl,
      routes?.index?.baseUrl,
      routes?.index?.path,
      routes?.show?.baseUrl,
      routes?.show?.path,
    ].filter((url) => typeof url === 'string');

    const keys = Object.keys(params);
    const values = Object.values(params).filter((value) => !isNil(value));

    return (
      keys.length !== values.length || (!keys.length && urls.some((url) => this.macro.test(url)))
    );
  }

  protected abstract createTransformer(): Transformer<FindOptions>;
}
