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
    await database.remove();
  });

  it('Should check document exists', async () => {
    await dataStore.insert({ id: '1', name: 'Bill' });

    const result = await dataStore.exists({ name: 'Bill' });
    expect(result).toBe(true);
  });
});
