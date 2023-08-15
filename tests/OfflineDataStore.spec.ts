import { RxDatabase } from 'rxdb';
import { initDatabase } from './database';
import { OfflineDataStore } from '../src';

describe('Offline DataStore', () => {
  let database: RxDatabase;
  let dataStore: OfflineDataStore;

  beforeEach(async () => {
    database = await initDatabase();
    dataStore = new OfflineDataStore({
      collection: database.collections.users,
    });
  });

  afterEach(async () => {
    await database.destroy();
  });

  it('should check document exists', async () => {
    await dataStore.save({ name: 'Bill' });

    const result = await dataStore.exists({ name: 'Bill' });
    expect(result).toBe(true);
  });
});
