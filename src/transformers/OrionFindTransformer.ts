import { isEmpty, isNil, isUndefined, omitBy, remove } from 'lodash';
import { Transformer } from './Transformer';
import { FindOptions } from '../DataStore';

export class OrionFindTransformer implements Transformer<FindOptions> {
  private readonly paramNames = {
    page: 'page',
    sort: 'sort',
    limit: 'limit',
    query: 'search',
    filter: 'filters',
    group: 'group',
  };

  private operators = new Map<string, string>([
    ['=', '='],
    ['>', '>'],
    ['>=', '>='],
    ['<', '<'],
    ['<=', '<='],
    ['<>', '!='],
    ['contains', 'like'],
    ['notcontains', 'not like'],
    ['startswith', 'like'],
    ['endswith', 'like'],
    ['in', 'in'],
    ['not in', 'not in'],
    ['custom', 'custom'],
  ]);

  private resolvers = new Map<string, (value: string | number) => any>([
    ['=', (value) => value],
    ['>', (value) => value],
    ['>=', (value) => value],
    ['<', (value) => value],
    ['<=', (value) => value],
    ['<>', (value) => value],
    ['contains', (value) => `%${value}%`],
    ['notcontains', (value) => `%${value}%`],
    ['startswith', (value) => `${value}%`],
    ['endswith', (value) => `%${value}`],
    ['in', (value) => value],
    ['not in', (value) => value],
    ['custom', (value) => value],
  ]);

  buildCondition(item: any): any {
    const key = item[1];
    const value = item[2];

    if (value === undefined) {
      return;
    }

    if (!this.operators.has(key)) {
      throw new Error(`The operator "${key}" is invalid`);
    }

    return {
      field: item[0],
      operator: this.operators.get(key),
      value: this.resolvers.get(key)(value),
    };
  }

  buildFilter(filters: any): any {
    if (!filters || isEmpty(filters)) {
      return null;
    }

    if (this.operators.has(filters[1])) {
      filters = [filters];
    }

    let type;
    const result = [];

    for (const expression of filters) {
      if (['or', 'and'].includes(expression)) {
        type = expression;
      } else {
        const isArray = Array.isArray(expression[0]);
        const condition = isArray ? this.buildFilter(expression) : this.buildCondition(expression);

        if (isArray) {
          result.push({ type, nested: condition });
        } else if (condition) {
          result.push(type ? { type, ...condition } : condition);
        }

        type = null;
      }
    }

    return result;
  }

  execute(data: FindOptions): any {
    const result = { method: 'POST', action: 'search' };

    if (!data || isEmpty(data)) {
      return result;
    }

    const paginate = data.limit && !isNil(data.skip);
    const page = paginate ? Math.ceil(data.skip / data.limit) : 0;

    const [withTrashed] = remove(data.filter, (filter) => filter[0] === 'with_trashed');
    const [onlyTrashed] = remove(data.filter, (filter) => filter[0] === 'only_trashed');

    const params: any = {
      [this.paramNames.limit]: data.limit,
      [this.paramNames.page]: paginate ? page + 1 : null,
      with_trashed: withTrashed ? withTrashed[2] === true : null,
      only_trashed: onlyTrashed ? onlyTrashed[2] === true : null,
    };

    const sort = data.sort?.map((order: any) => ({
      field: order.selector,
      direction: order.desc ? 'desc' : 'asc',
    }));

    const scopes = Object.entries(data.scopes || {}).map(([key, value]) => ({
      name: key,
      parameters: Array.isArray(value) ? value : [value],
    }));

    const filters = this.buildFilter(data.filter);

    const body = {
      sort,
      scopes,
      filters,
      search: data.search ? { value: data.search } : null,
      [this.paramNames.group]: data.group?.map((group) => group.selector),
    };

    return {
      ...result,
      params: omitBy(params, isNil),
      data: omitBy(body, isUndefined),
    };
  }
}
