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
    return document?.deleted ? null : this.populate(document);
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const transformer = new OfflineFindTransformer(this.options.search);

    const queryOptions = transformer.execute(options);
    const query = this.options.collection.find(queryOptions);
    const results = await query.exec();

    return Promise.all(results.map((result) => this.populate(result)));
  }

  async save(data: T): Promise<any> {
    let result;
    const key = this.key();
    const value = (data as any)[key];
    const collection = this.options.collection;

    data = this.normalize(data);

    if (value) {
      const document = await collection.findOne(value).exec();
      result = await document.incrementalPatch(data);
    } else {
      result = await collection.insert({
        [key]: uuidv4(),
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

  private async populate(document: RxDocument<T>): Promise<T> {
    const result: any = document.toMutableJSON();

    for (const key in this.collectionReferences()) {
      const references = await document.populate(key);
      result[key] = references.map((item: RxDocument<T>) =>
        item.toMutableJSON()
      );
    }

    return result;
  }

  private normalize(data: any): T {
    const references = Object.entries(this.collectionReferences());
    const result = { ...data };

    for (const [key, value] of references) {
      const schema = this.options.collection.database.collections[value].schema;
      const primaryPath = schema.primaryPath as string;
      result[key] = data[key].map((reference: any) => reference[primaryPath]);
    }

    return result;
  }

  private collectionReferences(): Record<string, string> {
    const result: Record<string, string> = {};
    const entries = Object.entries(
      this.options.collection.schema.jsonSchema.properties
    );

    for (const [key, value] of entries) {
      if (value.type === 'array' && value.ref) {
        result[key] = value.ref;
      }
    }

    return result;
  }
}
