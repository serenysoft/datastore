import { RxCollection, RxDocument } from 'rxdb';
import { pick } from 'lodash';
import { OfflineFindTransformer } from './transformers/OfflineFindTransformer';
import { DataStore, DataStoreOptions, FindOptions, LinkParams, MediaParams } from './DataStore';

export interface RxDBDataStoreOptions<T = any> extends DataStoreOptions {
  collection: RxCollection<T>;
  key?: string;
}

export class RxDBDataStore<T = any> implements DataStore<T> {
  private linkParams: LinkParams;
  private readonly foreignKeySuffix = /(_id|Id)$/;

  constructor(private options: RxDBDataStoreOptions<T>) {}

  collection(): RxCollection {
    return this.options.collection;
  }

  key(): string {
    return this.options.key || this.collection().schema.primaryPath;
  }

  async findOne(key: string): Promise<T> {
    const { primaryPath } = this.collection().schema;
    const condition = this.key() !== primaryPath ? { selector: { [this.key()]: key } } : key;

    const document = await this.collection().findOne(condition).exec();
    return document && !document.deleted ? this.populate(document) : null;
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    const transformer = new OfflineFindTransformer(this.options.search);

    const queryOptions = transformer.execute(options);
    const query = this.collection().find(queryOptions);
    const results = await query.exec();

    return Promise.all(results.map((result) => this.populate(result)));
  }

  async exists(condition: any): Promise<boolean> {
    const document = await this.collection().findOne({ selector: condition }).exec();
    return document !== null;
  }

  async count(condition?: any): Promise<number> {
    return this.collection().count({ selector: condition }).exec();
  }

  async insert(data: T): Promise<any> {
    const document = this.normalize({
      ...this.linkParams,
      ...data,
    });

    const result = await this.collection().insert(document);
    return result.toMutableJSON();
  }

  async update(data: T): Promise<any> {
    const key = (data as any)[this.key()];
    const document = await this.findOneOrFail(key);
    const result = await document.incrementalPatch(this.normalize(data));

    return result.toMutableJSON();
  }

  async remove(key: string): Promise<void> {
    const document = await this.findOneOrFail(key);
    await document.remove();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  download(key: string): Promise<Blob> {
    throw new Error('Feature not supported.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  upload(params: MediaParams): Promise<any> {
    throw new Error('Feature not supported.');
  }

  link(params: LinkParams): void {
    this.linkParams = params;
  }

  private async findOneOrFail(key: string): Promise<RxDocument<T>> {
    const document = await this.collection().findOne(key).exec();

    if (!document) {
      throw new Error('Record not found');
    }

    return document;
  }

  private async populate(document: RxDocument<T>): Promise<T> {
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
        } else {
          result[key.replace(this.foreignKeySuffix, '')] = reference.toMutableJSON();
        }
      }
    }

    return result;
  }

  private normalize(data: any): T {
    const result = { ...data };
    const keys = Object.keys(this.collection().schema.jsonSchema.properties);
    const references = Object.entries(this.collectionReferences());

    for (const [key, value] of references) {
      const collection = this.collection().database.collections[value.ref];
      const primaryPath = collection.schema.primaryPath as string;

      if (value.type === 'array') {
        result[key] = (data[key] || []).map((reference: any) => reference[primaryPath]);
      }
    }

    return pick(result, keys) as T;
  }

  private collectionReferences(): Record<string, any> {
    const result: Record<string, object> = {};
    const entries = Object.entries(this.collection().schema.jsonSchema.properties);

    for (const [key, value] of entries) {
      if (value.ref) {
        result[key] = { ref: value.ref, type: value.type };
      }
    }

    return result;
  }
}
