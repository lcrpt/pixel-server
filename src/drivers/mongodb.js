const mongoose = require('mongoose');
const assert = require('assert');

assert(process.env.DB_NAME, 'DB_NAME env var is required for this service.');
assert(process.env.DB_HOST, 'DB_HOST env var is required for this service.');

mongoose.connect(`${process.env.DB_HOST}/${process.env.DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose.connection;
