import { OrionFindTransformer } from '../../src/transformers/OrionFindTransformer';

describe('Orion - FindTransformer', () => {
  it('Should serialize find options to url query params', async () => {
    const trasformer = new OrionFindTransformer();

    let result = trasformer.execute(null);
    expect(result).toEqual({ method: 'POST', action: 'search' });

    result = trasformer.execute(undefined);
    expect(result).toEqual({ method: 'POST', action: 'search' });

    result = trasformer.execute({});
    expect(result).toEqual({ method: 'POST', action: 'search' });

    result = trasformer.execute({
      limit: 5,
      skip: 10,
      search: 'loren',
      sort: [
        { selector: 'age', desc: true },
        { selector: 'name', desc: false },
      ],
      group: [{ selector: 'city' }],
      filter: [
        ['active', '=', true],
        ['tag_id', 'in', [1, 2]],
        ['created_at', '>=', '2024-09-01'],
        ['created_at', '<=', '2024-09-03'],
        ['with_trashed', '=', true],
        'and',
        [['id', '=', 1], 'or', ['name', '=', 'Bill']],
      ],
      scopes: {
        whereCategory: [1],
      },
    });

    expect(result.method).toEqual('POST');
    expect(result.action).toEqual('search');
    expect(result.params).toEqual({ limit: 5, page: 3, with_trashed: true });
    expect(result.data).toEqual({
      filters: [
        {
          type: 'and',
          nested: [
            { field: 'active', operator: '=', value: true },
            { field: 'tag_id', operator: 'in', value: [1, 2] },
            { field: 'created_at', operator: '>=', value: '2024-09-01' },
            { field: 'created_at', operator: '<=', value: '2024-09-03' },
            {
              type: 'or',
              nested: [
                { field: 'id', operator: '=', value: 1 },
                { field: 'name', operator: '=', value: 'Bill' },
              ],
            },
          ],
        },
      ],
      scopes: [{ name: 'whereCategory', parameters: [1] }],
      search: { value: 'loren' },
      group: ['city'],
      sort: [
        { field: 'age', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  });
});
