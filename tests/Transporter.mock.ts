import nock from 'nock';

nock('http://api.fake.test')
  .get('/contacts')
  .reply(200, [
    { id: 1001, name: 'Jeff' },
    { id: 1002, name: 'Mark' },
    { id: 1003, name: 'Bill' },
  ]);
