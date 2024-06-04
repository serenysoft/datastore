import { addRxPlugin, createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';

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
    profileId: {
      type: 'number',
    },
    categoryId: {
      ref: 'categories',
      type: 'string',
    },
    country_id: {
      ref: 'countries',
      type: 'string',
    },
  },
  attachments: {
    encrypted: false,
  },
};

export const categorySchema = {
  version: 0,
  description: 'The category schema',
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

export const countrySchema = {
  version: 0,
  description: 'The country schema',
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
    storage: getRxStorageMemory(),
  });

  await database.addCollections({
    users: {
      schema: userSchema,
    },
    categories: {
      schema: categorySchema,
    },
    countries: {
      schema: countrySchema,
    },
  });

  return database;
}
