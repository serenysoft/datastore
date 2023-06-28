import { RxCollection, RxReplicationWriteToMasterRow } from 'rxdb';
import {
  replicateRxCollection,
  RxReplicationState,
} from 'rxdb/plugins/replication';
import { last, merge } from 'lodash';
import { Replicator, ReplicatorOptions } from './Replicator';
import { OrionFindTransformer } from '../transformers/OrionFindTransformer';
import { Request, Route, Transporter } from '../transporters/Transporter';

export interface OrionReplicatorOptions<T = any> extends ReplicatorOptions<T> {
  baseUrl: string | Route;
  transporter: Transporter;
  autoStart?: boolean;
  batchSize?: number;
  live?: boolean;
  retryTime?: number;
  waitForLeadership?: boolean;
  deletedField?: string;
  updatedAtField?: string;
  minUpdatedAtParam?: string;
  wrap?: string;
}

export class OrionReplicator<T = any> implements Replicator<T, any> {
  private replication: RxReplicationState<T, any>;

  constructor(private options: OrionReplicatorOptions<T>) {}

  get updatedAtField(): string {
    return this.options.updatedAtField || 'updated_at';
  }

  get deletedAtField(): string {
    return this.options.deletedField || '_deleted';
  }

  get primaryKeyField(): string {
    return this.options.collection.schema.primaryPath;
  }

  get minUpdatedAtParam(): string {
    return this.options.minUpdatedAtParam || 'minUpdatedAt';
  }

  get wrap(): string {
    return this.options.wrap || 'data';
  }

  collection(): RxCollection {
    return this.options.collection;
  }

  baseRoute(): Route {
    return typeof this.options.baseUrl === 'string'
      ? { path: this.options.baseUrl }
      : this.options.baseUrl;
  }

  async start(awaitInit: boolean = true): Promise<void> {
    if (!this.replication || this.replication.isStopped()) {
      this.replication = this.createReplication();
    }

    if (awaitInit) {
      await this.replication.awaitInitialReplication();
    }
  }

  async awaiInSync(): Promise<void> {
    await this.replication?.awaitInSync();
  }

  async stop(): Promise<void> {
    await this.replication?.cancel();
  }

  async pull(lastCheckpoint: any, batchSize: number) {
    const updatedAt = lastCheckpoint?.[this.updatedAtField];
    const transformer = new OrionFindTransformer();
    const transporter = this.options.transporter;

    let data;
    let page = 0;
    const result = [];

    do {
      const scopes = updatedAt ? { [this.minUpdatedAtParam]: updatedAt } : null;

      const route = transformer.execute({
        filter: { scopes },
        skip: batchSize * page,
        limit: batchSize,
      });

      data = await transporter.execute(
        merge({ wrap: this.wrap }, this.baseRoute(), route)
      );

      result.push(...data);
      page++;
    } while (data.length === batchSize);

    setTimeout(() => this.replication.reSync(), this.replication.retryTime);

    const lastDoc = last(result);
    const checkpoint = lastDoc
      ? {
          [this.primaryKeyField]: lastDoc[this.primaryKeyField],
          [this.updatedAtField]: lastDoc[this.updatedAtField],
        }
      : lastCheckpoint;

    return {
      documents: result,
      checkpoint: checkpoint,
    };
  }

  async push(documents: RxReplicationWriteToMasterRow<any>[]): Promise<any[]> {
    const { primaryKeyField, deletedAtField } = this;
    const transporter = this.options.transporter;
    const request = this.baseRoute() as Request;

    const docs = documents.map((doc) => ({
      ...doc.newDocumentState,
      _new: !doc.assumedMasterState,
    }));

    for (const doc of docs) {
      if (doc[deletedAtField]) {
        request.method = 'DELETE';
        request.key = doc[primaryKeyField];
      } else if (doc._new) {
        request.method = 'POST';
        request.data = doc;
      } else {
        request.method = 'PUT';
        request.key = doc[primaryKeyField];
        request.data = doc;
      }

      await transporter.execute(request);
    }

    return [];
  }

  createReplication() {
    const identifier = `${this.options.collection.name}-${this.options.baseUrl}`;

    return replicateRxCollection<T, any>({
      collection: this.options.collection,
      replicationIdentifier: identifier,
      waitForLeadership: this.options.waitForLeadership || false,
      autoStart: this.options.autoStart,
      retryTime: this.options.retryTime,
      live: this.options.live,
      pull: {
        batchSize: this.options.batchSize,
        handler: (lastCheckpoint, batchSize) =>
          this.pull(lastCheckpoint, batchSize),
      },
      push: {
        batchSize: this.options.batchSize,
        handler: (docs) => this.push(docs),
      },
    });
  }
}
