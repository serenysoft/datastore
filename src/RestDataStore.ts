import { isEmpty, isNil, isPlainObject, merge, omitBy } from 'lodash';
import { DataStore, DataStoreOptions, LinkParams } from './DataStore';
import { FindOptions } from './DataStore';
import { Transformer } from './transformers/Transformer';
import { serializeDates } from './utils';
import { Request, Transporter } from './transporters/Transporter';

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
  transporter: Transporter;
}

export abstract class RestDataStore<T = any> implements DataStore<T> {
  private linkParams: LinkParams;
  private readonly macro = /\{\w+\}/;

  public constructor(protected options: RestDataStoreOptions) {}

  public key(): string {
    return this.options.key;
  }

  public link(params: LinkParams): void {
    this.linkParams = params;
  }

  public async findOne(key: string): Promise<T> {
    if (this.hasInvalidLink()) {
      throw new Error('The link data must be set');
    }

    const request = merge(
      {
        method: 'GET',
        key: key,
        wrap: this.options.wrap,
      },
      this.options.routes?.show
    );

    const result = await this.execute(request);

    if (Array.isArray(result)) {
      return result.length ? result[0] : null;
    }

    return result;
  }

  public async findAll(options?: FindOptions): Promise<T[]> {
    if (this.hasInvalidLink()) {
      return [];
    }

    const transformer = this.createTransformer();
    const route = transformer.execute(options);
    const request = merge(
      {
        method: 'GET',
        wrap: this.options.wrap,
      },
      route,
      this.options.routes?.index
    );

    const result = await this.execute(request);

    return result;
  }

  public async save(data: T): Promise<any> {
    const key = (data as any)[this.options.key];

    if (key) {
      return await this.execute({
        method: 'PUT',
        key: key,
        data: data,
        wrap: this.options.wrap,
        ...this.options.routes?.update,
      });
    }

    const result = await this.execute({
      method: 'POST',
      data: data,
      wrap: this.options.wrap,
      ...this.options.routes?.create,
    });

    return result;
  }

  public async remove(key: string, force?: boolean): Promise<void> {
    await this.execute({
      method: 'DELETE',
      key: key,
      params: { force: force },
      ...this.options.routes?.remove,
    });
  }

  public async restore(key: string): Promise<void> {
    await this.execute({
      method: 'POST',
      path: 'restore',
      key: key,
      ...this.options.routes?.restore,
    });
  }

  public async validate(data: T): Promise<any> {
    const result = await this.execute({
      method: 'POST',
      path: 'validate',
      data: data,
      ...this.options.routes?.validate,
    });

    return result;
  }

  public async upload(data: FormData): Promise<any> {
    const result = await this.execute({
      method: 'POST',
      path: 'upload',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data,
      ...this.options.routes?.upload,
    });

    return result;
  }

  public async execute(route: Request) {
    const request = {
      baseUrl: this.options.baseUrl,
      ...route,
      params: omitBy(route.params, isNil),
      link: this.linkParams,
    };

    if (isEmpty(request.params)) {
      delete request.params;
    }

    if (isPlainObject(request.data)) {
      request.data = serializeDates(request.data);
    }

    return await this.options.transporter.execute(request);
  }

  protected hasInvalidLink(): boolean {
    const { baseUrl, routes } = this.options;

    const urls = [
      baseUrl,
      routes?.index?.baseUrl,
      routes?.index?.path,
      routes?.show?.baseUrl,
      routes?.show?.path,
    ].filter((url) => typeof url === 'string');

    return isEmpty(this.linkParams) && urls.some((url) => this.macro.test(url));
  }

  protected abstract createTransformer(): Transformer<FindOptions>;
}
