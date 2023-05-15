import { v4 as uuidv4 } from 'uuid';
import { DataStore, DataStoreOptions, FindOptions } from './DataStore';
import { RxCollection, RxDocument } from 'rxdb';
import { OfflineFindTransformer } from './transformers/OfflineFindTransformer';

export interface OfflineDataStoreOptions<T = any> extends DataStoreOptions {
  collection: RxCollection<T>;
}

export class OfflineDataStore<T = any> implements DataStore<T> {
  constructor(private options: OfflineDataStoreOptions<T>) {}

  key(): string {
    return this.options.collection.schema.primaryPath;
  }

  async findOne(key: string): Promise<T> {
    const document = await this.options.collection.findOne(key).exec();
    return document?.deleted ? null : document.toMutableJSON();
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const transformer = new OfflineFindTransformer(this.options.search);

    const queryOptions = transformer.execute(options);
    const query = this.options.collection.find(queryOptions);
    const results = await query.exec();

    return results.map((result: RxDocument<T>) => result.toMutableJSON());
  }

  async save(data: T): Promise<any> {
    let result;
    const keyName = this.key();
    const keyValue = (data as any)[keyName];
    const collection = this.options.collection;

    if (keyValue) {
      const document = await collection.findOne(keyValue).exec();
      result = await document.incrementalPatch(data);
    } else {
      result = await collection.insert({
        [keyName]: uuidv4(),
        ...data,
      });
    }

    return result.toMutableJSON();
  }

  async remove(key: string): Promise<void> {
    const document = await this.options.collection.findOne(key).exec();
    await document.remove();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  upload(data: FormData): Promise<any> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  link(data: Record<string, string | number>): void {
    throw new Error('Method not implemented.');
  }
}
