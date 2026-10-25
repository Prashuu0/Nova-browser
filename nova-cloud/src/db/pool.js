const config = require('../config');

const useSqlite = config.databaseUrl.startsWith('sqlite:');

module.exports = useSqlite
  ? require('./sqlite-pool')
  : require('./pg-pool');
