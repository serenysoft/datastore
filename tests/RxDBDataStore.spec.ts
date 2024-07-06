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

  it('Should find record by query', async () => {
    const categoryDataStore = new RxDBDataStore({
      key: 'name',
      collection: database.collections.categories,
    });

    await categoryDataStore.insert({ id: '1', name: 'Science' });

    let result = await categoryDataStore.findOne({
      filter: { id: '1', name: 'Science' },
    });
    expect(result).toBeTruthy();

    result = await categoryDataStore.findOne({
      filter: { id: '1', name: 'Technology' },
    });
    expect(result).toBe(null);
  });

  it('Should find record by alternative key', async () => {
    const categoryDataStore = new RxDBDataStore({
      key: 'name',
      collection: database.collections.categories,
    });

    await categoryDataStore.insert({ id: '1', name: 'Technology' });

    let result = await categoryDataStore.findOne('Technology');
    expect(result).toBeTruthy();

    result = await categoryDataStore.findOne('1');
    expect(result).toBe(null);
  });

  it('Should check document exists', async () => {
    await dataStore.insert({ id: '1', name: 'Bill' });

    const result = await dataStore.exists({ name: 'Bill' });
    expect(result).toBe(true);
  });

  it('Should check document count', async () => {
    let result = await dataStore.count();
    expect(result).toBe(0);

    await dataStore.insert({ id: '1', name: 'Bill' });

    result = await dataStore.count({ name: 'Bill' });
    expect(result).toBe(1);

    result = await dataStore.count({ name: 'Jeff' });
    expect(result).toBe(0);
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

  it('Should avoid trigger query search when link is invalid', async () => {
    dataStore.link({ profileId: null });

    await dataStore.insert({ id: '1', name: 'Bill', profileId: 2 });

    let result = await dataStore.findAll();
    expect(result.length).toBe(0);

    result = await dataStore.findOne({ filter: { id: '1' } });
    expect(result).toBeNull();
  });

  it('Should populate ref properties', async () => {
    await database.collections.countries.insert({ id: '1', name: 'Brazil' });
    await database.collections.categories.insert({ id: '1', name: 'Admin' });
    await dataStore.insert({ id: '1', name: 'Bill', categoryId: '1', country_id: '1' });

    const result = await dataStore.findOne('1');
    expect(result.category).toBeTruthy();
    expect(result.country).toBeTruthy();
  });
});
