import { isEmpty, isNil, omitBy } from 'lodash';
import { Transformer } from './Transformer';
import { FindOptions, Search } from '../DataStore';

export class OfflineFindTransformer implements Transformer<FindOptions> {
  constructor(private search: Search) {}

  execute(data: FindOptions): any {
    if (!data) {
      return null;
    }

    let selector = data.filter;
    const sort = data.sort || [];

    if (data.searchValue && this.search?.fields.length) {
      const condition = this.buildSearchCondition(data.searchValue);

      selector = !isEmpty(selector)
        ? { $and: [condition, selector] }
        : condition;
    }

    const result: any = {
      selector: selector,
      limit: data.limit,
      skip: data.skip,
    };

    if (sort.length) {
      result.sort = sort.map(
        (order) => ({ [order.selector]: order.desc ? 'desc' : 'asc' } as any)
      );
    } else if (this.search?.sort) {
      result.sort = [];
      for (const [key, value] of Object.entries(this.search.sort)) {
        result.sort.push({ [key]: value });
      }
    }

    return omitBy(result, (value) => isNil(value));
  }

  private buildSearchCondition(searchValue: string | number) {
    const result = this.search.fields.map((field) => {
      const value = searchValue as string;
      const name = typeof field === 'string' ? field : Object.keys(field)[0];
      const isText = typeof field === 'string' || field.type === 'string';

      return isText
        ? { [name]: { $regex: new RegExp(`.*${value}.*`, 'i') } }
        : { [name]: searchValue };
    });

    return result.length === 1 ? result[0] : { $or: result };
  }
}
