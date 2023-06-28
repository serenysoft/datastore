import axios, { AxiosInstance } from 'axios';
import { RxDatabase } from 'rxdb';
import { AxiosTransporter } from '../../transporters/AxiosTransporter';
import { OrionReplicator } from '../OrionReplicator';
import { initDatabase } from '../../../tests/database';

describe('Offline - DataStore', () => {
  let http: AxiosInstance;
  let transporter: AxiosTransporter;
  let database: RxDatabase;

  beforeAll(async () => {
    database = await initDatabase();
  });

  afterAll(async () => {
    await database.destroy();
  });

  beforeEach(() => {
    http = axios.create({ baseURL: 'http://api.fake.test' });
    transporter = new AxiosTransporter(http);
  });

  it('should include query params to base URL', async () => {
    jest
      .spyOn(AxiosTransporter.prototype, 'execute')
      .mockImplementation(() => Promise.resolve([]));

    const replicator = new OrionReplicator({
      baseUrl: {
        path: '/contacts',
        params: { include: 'address' },
      },
      collection: database.collections.contacts,
      transporter,
    });

    await replicator.start(true);
    await replicator.stop();

    expect(transporter.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          include: 'address',
          limit: 100,
          page: 1,
        },
      })
    );
  });
});
