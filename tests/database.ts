import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

export const userSchema = {
  version: 0,
  description: 'The user schema',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    name: {
      type: 'string',
    },
  },
};

export async function initDatabase() {
  const database = await createRxDatabase({
    name: 'testdb',
    storage: getRxStorageDexie({
      indexedDB: indexedDB,
      IDBKeyRange: IDBKeyRange,
    }),
  });

  await database.addCollections({
    users: {
      schema: userSchema,
    },
  });

  return database;
}
