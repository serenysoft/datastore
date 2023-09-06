import axios from 'axios';
import { AxiosTransporter, OrionDataStore } from '../src';

describe('Orion DataStore', () => {
  let transporter: AxiosTransporter;
  let executeMock: jest.FunctionProperties<any>;

  beforeEach(() => {
    transporter = new AxiosTransporter(axios.create());
    executeMock = jest.spyOn(transporter, 'execute').mockReturnValue(null);
  });

  it('Should return first element when result is an array', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    const contact = { id: '1', name: 'Bill' };
    executeMock.mockReturnValue(Promise.resolve(contact));
    const result = await dataStore.findOne('1');
    expect(result).toEqual(contact);
  });

  it('Should return null when result is an empty array', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    executeMock.mockReturnValue(Promise.resolve([]));

    const result = await dataStore.findOne('1');
    expect(result).toBeNull();
  });

  it('GET /{id} - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    await dataStore.findOne('1');

    expect(transporter.execute).toHaveBeenCalledWith({
      method: 'GET',
      key: '1',
      baseUrl: 'http://localhost/contacts',
      wrap: 'data',
    });
  });

  it('OPTIONS /{id} - Custom options', async () => {
    const headers = {
      'Accept': 'application/json',
    };

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
      transporter: transporter,
    });

    await dataStore.findOne('1');

    expect(transporter.execute).toHaveBeenCalledWith({
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

  it('GET / - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    await dataStore.findAll();

    expect(transporter.execute).toHaveBeenCalledWith({
      method: 'GET',
      baseUrl: 'http://localhost/contacts',
      wrap: 'data',
    });
  });

  it('OPTIONS / - Custom options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
      routes: {
        index: {
          path: 'index',
          method: 'OPTIONS',
        },
      },
    });

    await dataStore.findAll();

    expect(transporter.execute).toHaveBeenCalledWith({
      method: 'OPTIONS',
      baseUrl: 'http://localhost/contacts',
      path: 'index',
      wrap: 'data',
    });
  });

  it('POST / - Default options', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    const data = { name: 'Bill' };
    await dataStore.insert(data);

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    const data = { name: 'Bill' };
    await dataStore.insert(data);

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    const data = { id: '2', name: 'Bill' };
    await dataStore.update(data);

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    const data = { id: '3', name: 'Bill' };
    await dataStore.update(data);

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    await dataStore.remove('2');

    expect(transporter.execute).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'DELETE',
      key: '2',
    });

    await dataStore.remove('3', true);

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
      routes: {
        remove: {
          path: 'remove',
          method: 'OPTIONS',
        },
      },
    });

    await dataStore.remove('3');

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    await dataStore.restore('4');

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
      routes: {
        restore: {
          path: 'custom-restore',
          method: 'PUT',
        },
      },
    });

    await dataStore.restore('5');

    expect(transporter.execute).toHaveBeenCalledWith({
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
      transporter: transporter,
    });

    const data = { name: '' };
    await dataStore.validate(data);

    expect(transporter.execute).toHaveBeenCalledWith({
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

    expect(transporter.execute).toHaveBeenCalledWith({
      baseUrl: 'http://localhost/contacts',
      method: 'PUT',
      data: data,
      path: 'custom-validate',
    });
  });

  it('POST /search - exists', async () => {
    executeMock.mockReturnValue([]);

    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://localhost/contacts',
      transporter: transporter,
    });

    await dataStore.exists({ name: 'Bill' });

    expect(transporter.execute).toHaveBeenCalledWith({
      data: {
        filters: [{ field: 'name', operator: '=', value: 'Bill' }],
        scopes: [],
      },
      method: 'POST',
      baseUrl: 'http://localhost/contacts',
      action: '/search',
      wrap: 'data',
    });
  });

  /*
  it('POST /upload', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://testing.com/contacts',
      transporter: transporter,
    });

    const formData = new FormData();
    formData.append('file', 'base64');

    await dataStore.upload(formData);

    expect(transporter.execute).toHaveBeenCalledWith({
      baseUrl: 'http://testing.com/contacts',
      method: 'POST',
      path: 'upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  });

  it('PUT /custom-upload', async () => {
    const dataStore = new OrionDataStore({
      key: 'id',
      baseUrl: 'http://testing.com/contacts',
      transporter: transporter,
      routes: {
        upload: {
          path: 'custom-upload',
          method: 'PUT',
        },
      },
    });

    const formData = new FormData();
    formData.append('file', 'base64');

    await dataStore.upload(formData);

    expect(transporter.execute).toHaveBeenCalledWith({
      baseUrl: 'http://testing.com/contacts',
      method: 'PUT',
      path: 'custom-upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  });
  */
});
