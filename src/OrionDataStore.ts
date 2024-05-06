import { FindOptions } from './DataStore';
import { RestDataStore, RestDataStoreOptions } from './RestDataStore';
import { OrionFindTransformer } from './transformers/OrionFindTransformer';
import { Transformer } from './transformers/Transformer';

export interface OrionDataStoreOptions extends RestDataStoreOptions {
  attachable?: boolean;
}

export class OrionDataStore<T = any> extends RestDataStore<OrionDataStoreOptions, T> {
  public constructor({
    search,
    key,
    baseUrl,
    headers,
    routes,
    paramNames,
    transporter,
    wrap = 'data',
    attachable,
  }: OrionDataStoreOptions) {
    super({
      search,
      key,
      baseUrl,
      headers,
      routes,
      paramNames,
      transporter,
      wrap,
      attachable,
    });
  }

  public async insert(data: T): Promise<any> {
    if (this.options.attachable) {
      return this.attach(data);
    }

    return super.insert(data);
  }

  public async remove(key: string, force?: boolean): Promise<void> {
    if (this.options.attachable) {
      return this.detach({ [this.options.key]: key });
    }

    return super.remove(key, force);
  }

  public async attach(data: any): Promise<any> {
    const key = data[this.options.key];

    const result = await this.execute({
      method: 'POST',
      path: 'attach',
      data: { resources: [key] },
    });

    return result;
  }

  public async detach(data: any): Promise<any> {
    const key = data[this.options.key];

    const result = await this.execute({
      method: 'DELETE',
      path: 'detach',
      data: { resources: [key] },
    });

    return result;
  }

  protected createTransformer(): Transformer<FindOptions> {
    return new OrionFindTransformer();
  }
}
