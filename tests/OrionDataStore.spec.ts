import { OrionDataStore, Transporter } from '../src';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Orion DataStore', () => {
  let transporter: Transporter;

  beforeEach(() => {
    transporter = jest.fn().mockReturnValue(Promise.resolve({}));
  });

  it('Should return first element when result is an array', async () => {
    const contact = { id: '1', name: 'Bill' };

    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: () => Promise.resolve({ data: contact }),
    });

    const result = await dataStore.findOne('1');
    expect(result).toEqual(contact);
  });

  it('Should return null when result is an empty array', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: () => Promise.resolve({ data: [] }),
    });

    const result = await dataStore.findOne('1');
    expect(result).toBeNull();
  });

  it('GET /{id} - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    await dataStore.findOne('1');

    expect(transporter).toHaveBeenCalledWith({
      method: 'GET',
      key: '1',
      baseUrl: 'http://localhost/contacts',
      wrap: 'data',
    });
  });

  it('OPTIONS /{id} - Custom options', async () => {
    const headers = { 'Accept': 'application/json' };

    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      routes: {
        show: {
          path: 'show',
          method: 'OPTIONS',
          params: { 'active': true },
        },
      },
      headers: headers,
      transporter,
    });

    await dataStore.findOne('1');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      key: '1',
      method: 'OPTIONS',
      path: 'show',
      wrap: 'data',
      params: {
        active: true,
      },
    });
  });

  it('POST /search - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    await dataStore.findAll();

    expect(transporter).toHaveBeenCalledWith({
      method: 'POST',
      baseUrl: 'http://localhost/contacts',
      action: 'search',
      wrap: 'data',
    });
  });

  it('OPTIONS /search - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
      routes: {
        index: {
          path: 'index',
          method: 'OPTIONS',
        },
      },
    });

    await dataStore.findAll();

    expect(transporter).toHaveBeenCalledWith({
      method: 'OPTIONS',
      baseUrl: 'http://localhost/contacts',
      path: 'index',
      action: 'search',
      wrap: 'data',
    });
  });

  it('POST / - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    const data = { name: 'Bill' };
    await dataStore.insert(data);

    expect(transporter).toHaveBeenCalledWith({
      data: data,
      method: 'POST',
      baseUrl: 'http://localhost/contacts',
      wrap: 'data',
    });
  });

  it('PATCH / - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      routes: {
        create: {
          path: 'create',
          method: 'PATCH',
        },
      },
      transporter,
    });

    const data = { name: 'Bill' };
    await dataStore.insert(data);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PATCH',
      path: 'create',
      wrap: 'data',
      data: data,
    });
  });

  it('PUT /{id} - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    const data = { id: '2', name: 'Bill' };
    await dataStore.update(data);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PUT',
      key: '2',
      wrap: 'data',
      data: data,
    });
  });

  it('PATCH /{id} - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      routes: {
        update: {
          path: 'update',
          method: 'PATCH',
        },
      },
      transporter,
    });

    const data = { id: '3', name: 'Bill' };
    await dataStore.update(data);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PATCH',
      key: '3',
      path: 'update',
      wrap: 'data',
      data: data,
    });
  });

  it('DELETE /{id} - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    await dataStore.remove('2');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'DELETE',
      key: '2',
    });

    await dataStore.remove('3', true);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'DELETE',
      key: '3',
      params: {
        force: true,
      },
    });
  });

  it('OPTIONS /{id} - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
      routes: {
        remove: {
          path: 'remove',
          method: 'OPTIONS',
        },
      },
    });

    await dataStore.remove('3');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'OPTIONS',
      key: '3',
      path: 'remove',
    });
  });

  it('POST /restore/{id} - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    await dataStore.restore('4');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'POST',
      key: '4',
      path: 'restore',
    });
  });

  it('PUT /restore/{id} - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
      routes: {
        restore: {
          path: 'custom-restore',
          method: 'PUT',
        },
      },
    });

    await dataStore.restore('5');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PUT',
      key: '5',
      path: 'custom-restore',
    });
  });

  it('POST /validate - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    const data = { name: '' };
    await dataStore.validate(data);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'POST',
      data: data,
      path: 'validate',
    });
  });

  it('PUT /validate - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
      routes: {
        validate: {
          path: 'custom-validate',
          method: 'PUT',
        },
      },
    });

    const data = { name: '' };
    await dataStore.validate(data);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PUT',
      data: data,
      path: 'custom-validate',
    });
  });

  it('POST /search - exists', async () => {
    const transporter = jest.fn().mockReturnValue(Promise.resolve({ data: [] }));

    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter,
    });

    await dataStore.exists(['name', '=', 'Bill']);

    expect(transporter).toHaveBeenCalledWith({
      data: {
        filters: [{ field: 'name', operator: '=', value: 'Bill' }],
        scopes: [],
      },
      method: 'POST',
      baseUrl: 'http://localhost/contacts',
      action: 'search',
      wrap: 'data',
    });
  });

  it('POST /media', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://testing.com/contacts/{contact}/media',
      transporter,
    });

    const type = 'image/png';
    const file = readFileSync(resolve(__dirname, './fixtures/icon.png'));
    const params = {
      id: '1.1',
      name: 'icon.png',
      file: new Blob([file], { type }),
      type,
    };

    dataStore.link({ contact: 1 });

    await dataStore.upload(params);

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://testing.com/contacts/1/media',
      method: 'POST',
      blob: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: params,
    });
  });

  it('GET /media/{id}', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://testing.com/contacts/{contact}/media',
      transporter,
    });

    dataStore.link({ contact: 1 });

    await dataStore.download('2');

    expect(transporter).toHaveBeenCalledWith({
      baseUrl: 'http://testing.com/contacts/1/media',
      method: 'GET',
      path: '2',
      blob: true,
    });
  });

  it('Should return an empty array when invalid link is detected', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://testing.com/contacts/{contact}/media',
      transporter,
    });

    dataStore.link({ contact: null });

    let results = await dataStore.findAll();

    expect(results.length).toBe(0);

    dataStore.link({});

    results = await dataStore.findAll();
    expect(results.length).toBe(0);
  });
});
