import { DateTime } from 'luxon';
import { FORMAT_SQL_DATE, FORMAT_SQL_DATETIME, serializeDates } from '../src/utils';

describe('Utils', () => {
  it('serializeDates', () => {
    const date = DateTime.now().startOf('day');
    const dueDate = DateTime.now().plus(5);

    const object = {
      id: 'abc-def',
      amount: 10.45,
      startTime: date.toJSDate(),
      tags: ['javascript', 'typescript'],
      children: [1, 2, 3],
      lines: [
        { id: 1, quantity: 10, total: 10.45, dueDate: dueDate.toJSDate() },
        { id: 2, quantity: 20, total: 20.9, dueDate: null },
      ],
    };

    const result = serializeDates(object);
    expect(result).toEqual({
      id: 'abc-def',
      amount: 10.45,
      startTime: date.toFormat(FORMAT_SQL_DATE),
      tags: ['javascript', 'typescript'],
      children: [1, 2, 3],
      lines: [
        {
          id: 1,
          quantity: 10,
          total: 10.45,
          dueDate: dueDate.toFormat(FORMAT_SQL_DATETIME),
        },
        {
          id: 2,
          quantity: 20,
          total: 20.9,
        },
      ],
    });
  });
});
