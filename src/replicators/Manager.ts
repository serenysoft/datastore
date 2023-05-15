import { RxCollection } from 'rxdb';
import { IReplicator } from './Replicator';

export class Manager {
  private instances = new Map<RxCollection, IReplicator>();

  add(instance: IReplicator): this {
    this.instances.set(instance.collection(), instance);
    return this;
  }

  get(collection: RxCollection): IReplicator {
    return this.instances.get(collection);
  }

  async start(awaitInit = true): Promise<void> {
    const values = Array.from(this.instances.values());
    await Promise.all(values.map((instance) => instance.start(awaitInit)));
  }

  async stop(): Promise<void> {
    const values = Array.from(this.instances.values());
    await Promise.all(values.map((instance) => instance.stop()));
  }
}
