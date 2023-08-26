import { v4 as uuidv4 } from 'uuid';
import { DataStore, DataStoreOptions, FindOptions, LinkParams } from './DataStore';
import { RxCollection, RxDocument } from 'rxdb';
import { OfflineFindTransformer } from './transformers/OfflineFindTransformer';

export interface OfflineDataStoreOptions<T = any> extends DataStoreOptions {
  collection: RxCollection<T>;
}

export class OfflineDataStore<T = any> implements DataStore<T> {
  private linkParams: LinkParams;

  constructor(private options: OfflineDataStoreOptions<T>) {}

  key(): string {
    return this.options.collection.schema.primaryPath;
  }

  async findOne(key: string): Promise<T> {
    const document = await this.options.collection.findOne(key).exec();
    return document && !document.deleted ? this.populate(document, true) : null;
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const transformer = new OfflineFindTransformer(this.options.search);

    const queryOptions = transformer.execute(options);
    const query = this.options.collection.find(queryOptions);
    const results = await query.exec();

    return Promise.all(results.map((result) => this.populate(result)));
  }

  async exists(condition: any): Promise<boolean> {
    const document = await this.options.collection.findOne({ selector: condition }).exec();
    return document !== null;
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
      const doc = {
        [key]: uuidv4(),
        ...data,
        ...this.linkParams,
      };

      result = await collection.insert(doc);
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

  link(params: LinkParams): void {
    this.linkParams = params;
  }

  private async populate(document: RxDocument<T>, onlyArray: boolean = false): Promise<T> {
    const result: any = document.toMutableJSON();

    for (const [key, value] of Object.entries(this.collectionReferences())) {
      const reference = await document.populate(key);
      const isArray = value.type === 'array';

      if (!reference) {
        if (isArray) {
          result[key] = [];
        }
      } else {
        if (isArray) {
          result[key] = reference.map((item: RxDocument<T>) => item.toMutableJSON());
        } else if (!onlyArray) {
          result[key.replace('_id', '')] = reference.toMutableJSON();
        }
      }
    }

    return result;
  }

  private normalize(data: any): T {
    const references = Object.entries(this.collectionReferences());
    const result = { ...data };

    for (const [key, value] of references) {
      const collection = this.options.collection.database.collections[value.ref];
      const primaryPath = collection.schema.primaryPath as string;

      if (value.type === 'array') {
        result[key] = (data[key] || []).map((reference: any) => reference[primaryPath]);
      }
    }

    return result;
  }

  private collectionReferences(): Record<string, any> {
    const result: Record<string, object> = {};
    const entries = Object.entries(this.options.collection.schema.jsonSchema.properties);

    for (const [key, value] of entries) {
      if (value.ref) {
        result[key] = { ref: value.ref, type: value.type };
      }
    }

    return result;
  }
}
