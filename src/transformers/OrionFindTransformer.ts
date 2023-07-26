import { isEmpty, isNil, omit, omitBy } from 'lodash';
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

  execute(data: FindOptions): any {
    if (!data || isEmpty(data)) {
      return null;
    }

    const paginate = data.limit && !isNil(data.skip);
    const page = paginate ? Math.ceil(data.skip / data.limit) : 0;

    const scopes = data.filter?.scopes || {};
    const filters = data.filter?.filters || {};
    const trashed = filters._trashed;

    const params: any = {
      [this.paramNames.limit]: data.limit,
      [this.paramNames.page]: paginate ? page + 1 : null,
    };

    if (trashed) {
      params[trashed] = true;
    }

    const sort = data.sort?.map((order: any) => ({
      field: order.selector,
      direction: order.desc ? 'desc' : 'asc',
    }));

    const scopesResult = Object.entries(scopes).map(([key, value]) => ({
      name: key,
      parameters: Array.isArray(value) ? value : [value],
    }));

    const filtersResult = Object.entries(omit(filters, '_trashed')).map(([key, value]) => ({
      field: key,
      operator: Array.isArray(value) ? 'in' : '=',
      value: value,
    }));

    const body = {
      search: data.searchValue ? { value: data.searchValue } : null,
      sort: sort,
      scopes: scopesResult,
      filters: filtersResult,
      [this.paramNames.group]: data.group?.map((group) => group.selector),
    };

    return {
      method: 'POST',
      params: omitBy(params, isNil),
      data: omitBy(body, isNil),
      suffix: '/search',
    };
  }
}
