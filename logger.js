const { createLogger, format, transports } = require('winston');
require('winston-mongodb');

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.MongoDB({
      db: 'mongodb://localhost:27017/logs',
      collection: 'server_errors',
      level: 'error',
      options: { useUnifiedTopology: true }
    })
  ]
});

module.exports = logger;