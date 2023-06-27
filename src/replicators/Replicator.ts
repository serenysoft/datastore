import { RxCollection, RxReplicationWriteToMasterRow } from 'rxdb';

export interface ReplicatorOptions<O = any> {
  collection: RxCollection<O>;
}

export interface Replicator<T = any, R = any> {
  pull(lastCheckpoint: any, batchSize: number): Promise<R>;

  push(data: RxReplicationWriteToMasterRow<T>[]): Promise<R[]>;

  start(awaitInit: boolean): Promise<void>;

  stop(): Promise<void>;

  collection(): RxCollection;
}
