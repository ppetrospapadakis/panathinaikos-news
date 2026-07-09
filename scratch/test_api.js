const handler = require('../api/articles.js');

const req = {
  method: 'GET',
  query: { id: '6f9820b3-2348-4059-84f5-97ff56d6af87' },
  headers: {}
};

const res = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    console.log("STATUS CODE:", this.statusCode);
    console.log("RESPONSE BODY:", JSON.stringify(body, null, 2));
  }
};

handler(req, res);
