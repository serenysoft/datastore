import { RxDatabase } from 'rxdb';
import { initDatabase } from './database';
import { OfflineDataStore } from '../src';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

  it('should check document exists', async () => {
    await dataStore.insert({ id: '1', name: 'Bill' });

    const result = await dataStore.exists({ name: 'Bill' });
    expect(result).toBe(true);
  });

  it('should store/remove media', async () => {
    const type = 'image/png';
    const file = readFileSync(resolve(__dirname, './fixtures/icon.png'));
    const blob = new Blob([file], { type });

    const user = await dataStore.insert({ id: '1', name: 'Bill' });
    await dataStore.putMedia(user.id, blob, { name: 'unique-name', type });

    let media = await dataStore.allMedia(user.id);
    expect(media.length).toBe(1);

    await dataStore.removeMedia(user.id, 'unique-name');
    media = await dataStore.allMedia(user.id);
    expect(media.length).toBe(0);
  });
});
