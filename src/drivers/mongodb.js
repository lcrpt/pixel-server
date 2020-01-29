const { MongoClient } = require('mongodb');
const assert = require('assert');

module.exports.init = () => {
  assert(process.env.DB_HOST, 'DB_HOST env var is required for this service.');
  assert(process.env.DB_NAME, 'DB_NAME env var is required for this service.');

  return MongoClient.connect(process.env.DB_HOST).then(client => {
    const db = client.db(process.env.DB_NAME);

    module.exports.db = db;
    return db;
  });
};
