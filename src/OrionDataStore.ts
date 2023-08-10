import { FindOptions } from './DataStore';
import { RestDataStore, RestDataStoreOptions } from './RestDataStore';
import { OrionFindTransformer } from './transformers/OrionFindTransformer';
import { Transformer } from './transformers/Transformer';

export interface OrionDataStoreOptions extends RestDataStoreOptions {
  attachable?: boolean;
}

export class OrionDataStore<T = any> extends RestDataStore<T> {
  public constructor(protected options: OrionDataStoreOptions) {
    const opts = { ...options, wrap: options.wrap || 'data' };
    super(opts);
    this.options = opts;
  }

  public async save(data: T): Promise<any> {
    if (this.options.attachable) {
      return this.attach(data);
    }

    return super.save(data);
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
