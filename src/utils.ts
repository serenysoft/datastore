import { isNil, isObjectLike } from 'lodash';
import { DateTime } from 'luxon';

export const FORMAT_SQL_DATE = 'yyyy-MM-dd';
export const FORMAT_SQL_DATETIME = 'yyyy-MM-dd HH:mm:ss';

export function serializeDates(data: object): any {
  const result: any = {};

  for (const [attribute, value] of Object.entries(data)) {
    if (isNil(value)) {
      continue;
    }

    if (Array.isArray(value)) {
      result[attribute] = value.map((element: any) =>
        isObjectLike(element) ? serializeDates(element) : element,
      );
    } else if (value instanceof Date) {
      const date = DateTime.fromJSDate(value);
      const hasTime = !date.startOf('day').equals(date);

      result[attribute] = hasTime
        ? date.toFormat(FORMAT_SQL_DATETIME)
        : date.toFormat(FORMAT_SQL_DATE);
    } else {
      result[attribute] = value;
    }
  }

  return result;
}
