import { flatMap } from 'lodash';
import { RxDBFindTransformer } from '../../src/transformers/RxDBFindTransformer';

describe('Offline - FindTransformer', () => {
  it('Should transform find options by nullish values', async () => {
    const trasformer = new RxDBFindTransformer({
      fields: ['name', { age: 'number' }],
    });

    let result = trasformer.execute(null);
    expect(result).toBeNull();

    result = trasformer.execute(undefined);
    expect(result).toBeNull();

    result = trasformer.execute({});
    expect(result).toEqual({});
  });

  it('Should transform find options', async () => {
    const trasformer = new RxDBFindTransformer({
      fields: ['name', { age: 'number' }],
      sort: {
        age: 'asc',
        updatedAt: 'desc',
      },
    });

    const result = trasformer.execute({
      limit: 5,
      skip: 10,
      search: 10,
      group: [{ selector: 'category' }],
      sort: [
        { selector: 'age', desc: true },
        { selector: 'name', desc: false },
      ],
      filter: [
        ['active', '=', true],
        ['scope', '=', undefined],
      ],
    });

    expect(result).toEqual({
      limit: 5,
      skip: 10,
      selector: {
        $and: [
          { active: true },
          { $or: [{ name: { $regex: new RegExp('.*10.*', 'i') } }, { age: 10 }] },
        ],
      },
      sort: [{ category: 'asc' }, { age: 'desc' }, { name: 'asc' }],
    });

    const keys = flatMap(result.selector.$and, (obj) => Object.keys(obj));
    expect(keys).not.toContain('scope');
  });

  it('Should transform default sort only when sort options was not defined', async () => {
    const trasformer = new RxDBFindTransformer({
      fields: ['name', { age: 'number' }],
      sort: {
        age: 'asc',
        updatedAt: 'desc',
      },
    });

    const result = trasformer.execute({
      limit: 5,
      skip: 10,
    });

    expect(result).toEqual({
      limit: 5,
      skip: 10,
      sort: [{ age: 'asc' }, { updatedAt: 'desc' }],
    });
  });
});
