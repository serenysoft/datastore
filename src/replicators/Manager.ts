import { RxCollection } from 'rxdb';
import { Replicator } from './Replicator';

export class Manager {
  private instances = new Map<RxCollection, Replicator>();

  constructor(instances: Replicator[] = []) {
    instances.forEach((instance) => {
      this.add(instance);
    });
  }

  add(instance: Replicator): this {
    this.instances.set(instance.collection(), instance);
    return this;
  }

  get(collection: RxCollection): Replicator {
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
