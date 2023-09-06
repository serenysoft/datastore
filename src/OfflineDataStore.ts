import { DataStore, DataStoreOptions, FindOptions, LinkParams, MediaParams } from './DataStore';
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

  async insert(data: T): Promise<any> {
    const doc = {
      ...data,
      ...this.linkParams,
    };

    const result = await this.options.collection.insert(doc);
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

  async putMedia(key: string, data: Blob, params: MediaParams): Promise<any> {
    const document = await this.findOneOrFail(key);

    return await document.putAttachment({
      id: params.name,
      type: params.type,
      data,
    });
  }

  async removeMedia(key: string, name: string): Promise<void> {
    const document = await this.findOneOrFail(key);

    const attachment = document.getAttachment(name);
    await attachment?.remove();
  }

  async allMedia(key: string): Promise<any[]> {
    const document = await this.findOneOrFail(key);

    return document.allAttachments();
  }

  link(params: LinkParams): void {
    this.linkParams = params;
  }

  private async findOneOrFail(key: string): Promise<RxDocument<T>> {
    const document = await this.options.collection.findOne(key).exec();

    if (!document) {
      throw new Error('Record not found');
    }

    return document;
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
