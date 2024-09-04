import { compact, flatMap, isEmpty, isNil, omitBy } from 'lodash';
import { Transformer } from './Transformer';
import { FindOptions, Search } from '../DataStore';

export class RxDBFindTransformer implements Transformer<FindOptions> {
  constructor(private search: Search) {}

  private logics = new Map<string, string>([
    ['and', '$and'],
    ['or', '$or'],
  ]);

  private operators = new Map<string, string>([
    ['>', '$gt'],
    ['>=', '$gte'],
    ['<', '$lt'],
    ['<=', '$lte'],
    ['<>', '$ne'],
    ['contains', '$regex'],
    ['notcontains', 'not like'],
    ['startswith', '$regex'],
    ['endswith', '$regex'],
    ['in', '$in'],
    ['not in', 'not in'],
    ['custom', 'custom'],
  ]);

  private resolvers = new Map<string, (value: string | number) => any>([
    ['contains', (value) => new RegExp(`.*${value}.*`, 'i')],
    ['notcontains', (value) => new RegExp(`.*${value}.*`, 'i')],
    ['startswith', (value) => new RegExp(`^${value}.*`, 'i')],
    ['endswith', (value) => new RegExp(`.*${value}$`, 'i')],
  ]);

  buildCondition(item: any): any {
    if (item[2] === undefined) {
      return;
    }

    const operator = this.operators.get(item[1]);
    const resolver = this.resolvers.get(item[1]);

    if (!operator) {
      return { [item[0]]: item[2] };
    }

    return {
      [item[0]]: {
        [operator]: resolver ? resolver(item[2]) : item[2],
      },
    };
  }

  buildSelector(filter: any, asArray: boolean = true): any {
    if (isEmpty(filter)) {
      return null;
    }

    if (!Array.isArray(filter[0])) {
      const result = this.buildCondition(filter);
      return asArray ? [result] : result;
    }

    const logic = filter.find((item: any) => !Array.isArray(item)) || 'and';
    const items = filter.filter((item: any) => Array.isArray(item));

    const result = {
      [this.logics.get(logic)]: compact(
        items.map((item: any) =>
          Array.isArray(item[0]) ? this.buildSelector(item, false) : this.buildCondition(item),
        ),
      ),
    };

    return asArray ? [result] : result;
  }

  execute(data: FindOptions): any {
    if (!data) {
      return null;
    }

    const sort = data.sort || [];
    const filter = data.filter || [];

    if (data.group?.length) {
      const groups = data.group?.map((group) => ({
        selector: group.selector,
        desc: false,
      }));
      sort.unshift(...groups);
    }

    if (data.search && this.search?.fields.length) {
      filter.push(this.buildSearchCondition(data.search));
    }

    const selector = this.buildSelector(filter, false);

    const result: any = {
      selector,
      limit: data.limit,
      skip: data.skip,
    };

    if (sort.length) {
      result.sort = sort.map((order) => ({ [order.selector]: order.desc ? 'desc' : 'asc' }) as any);
    } else if (this.search?.sort) {
      result.sort = [];
      for (const [key, value] of Object.entries(this.search.sort)) {
        result.sort.push({ [key]: value });
      }
    }

    return omitBy(result, (value) => isNil(value));
  }

  private buildSearchCondition(search: string | number) {
    const result = this.search.fields.map((field) => {
      const name = typeof field === 'string' ? field : Object.keys(field)[0];
      const isText = typeof field === 'string' || field.type === 'string';
      const operator = isText ? 'contains' : '=';
      return [name, operator, search];
    });

    return flatMap(result, (item: any, index) => {
      return index === result.length - 1 ? [item] : [item, 'or'];
    });
  }
}
