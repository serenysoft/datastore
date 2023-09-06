import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

addRxPlugin(RxDBAttachmentsPlugin);

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
  attachments: {
    encrypted: false,
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
