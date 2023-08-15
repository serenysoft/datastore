import { OrionFindTransformer } from '../../src/transformers/OrionFindTransformer';

describe('Orion - FindTransformer', () => {
  it('Should serialize find options to url query params', async () => {
    const trasformer = new OrionFindTransformer();

    let result = trasformer.execute(null);
    expect(result).toBeNull();

    result = trasformer.execute(undefined);
    expect(result).toBeNull();

    result = trasformer.execute({});
    expect(result).toBeNull();

    result = trasformer.execute({
      limit: 5,
      skip: 10,
      searchValue: 'loren',
      sort: [
        { selector: 'age', desc: true },
        { selector: 'name', desc: false },
      ],
      group: [{ selector: 'scope' }],
      filter: {
        filters: {
          active: true,
          tag_id: [1, 2],
          _trashed: 'with_trashed',
        },
        scopes: { whereCategory: 1 },
      },
    });

    expect(result.method).toEqual('POST');
    expect(result.action).toEqual('/search');
    expect(result.params).toEqual({ limit: 5, page: 3, with_trashed: true });
    expect(result.data).toEqual({
      filters: [
        { field: 'active', operator: '=', value: true },
        { field: 'tag_id', operator: 'in', value: [1, 2] },
      ],
      scopes: [{ name: 'whereCategory', parameters: [1] }],
      search: { value: 'loren' },
      group: ['scope'],
      sort: [
        { field: 'age', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  });
});
