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
      search: 'loren ipsum dolor',
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
        ['name', 'contains', 'Steven Paul Jobs'],
        ['age', '<>', undefined],
        ['with_trashed', '=', true],
        'or',
        [['id', '=', 1], 'and', ['name', '=', 'Bill']],
      ],
      scopes: {
        whereCategory: [1],
      },
      aggregates: [{ type: 'exists', selector: 'tags' }],
      params: {
        pagination: 0,
      },
    });

    expect(result.method).toEqual('POST');
    expect(result.action).toEqual('search');
    expect(result.params).toEqual({ limit: 5, page: 3, with_trashed: true, pagination: 0 });
    expect(result.data).toEqual({
      filters: [
        { field: 'active', operator: '=', value: true },
        { field: 'tag_id', operator: 'in', value: [1, 2] },
        { field: 'created_at', operator: '>=', value: '2024-09-01' },
        { field: 'created_at', operator: '<=', value: '2024-09-03' },
        { field: 'name', operator: 'like', value: 'Steven%Paul%Jobs' },
        {
          type: 'or',
          nested: [
            { field: 'id', operator: '=', value: 1 },
            { type: 'and', field: 'name', operator: '=', value: 'Bill' },
          ],
        },
      ],
      aggregates: [{ type: 'exists', relation: 'tags' }],
      scopes: [{ name: 'whereCategory', parameters: [1] }],
      search: { value: 'loren%ipsum%dolor' },
      group: ['city'],
      sort: [
        { field: 'age', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  });

  it('Should throw invalid operator error', async () => {
    const trasformer = new OrionFindTransformer();

    expect(() => {
      trasformer.execute({ filter: [['name', '!=', 'joe']] });
    }).toThrow('The operator "!=" is invalid');
  });
});
