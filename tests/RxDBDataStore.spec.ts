import { RxDatabase } from 'rxdb';
import { initDatabase } from './database';
import { RxDBDataStore } from '../src';

describe('Offline DataStore', () => {
  let database: RxDatabase;
  let dataStore: RxDBDataStore;

  beforeEach(async () => {
    database = await initDatabase();
    dataStore = new RxDBDataStore({
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

  it('Should assign link properties', async () => {
    dataStore.link({ profileId: 1 });

    await dataStore.insert({ id: '1', name: 'Bill' });

    const result = await dataStore.findOne('1');
    expect(result.profileId).toBe(1);
  });

  it('Should ignore link assignment when document has the property defined', async () => {
    dataStore.link({ profileId: 1 });

    await dataStore.insert({ id: '1', name: 'Bill', profileId: 2 });

    const result = await dataStore.findOne('1');
    expect(result.profileId).toBe(2);
  });

  it('Should build referenced properties', async () => {
    await database.collections.countries.insert({ id: '1', name: 'Brazil' });
    await database.collections.categories.insert({ id: '1', name: 'Admin' });
    await dataStore.insert({ id: '1', name: 'Bill', categoryId: '1', country_id: '1' });

    const result = await dataStore.findOne('1');
    expect(result.category).toBeTruthy();
    expect(result.country).toBeTruthy();
  });
});
