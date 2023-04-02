const fs = require('fs');
const { createStream } = require('tail');
const winston = require('winston');
const expressWinston = require('express-winston');

// Create a logger with a file transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'log.txt' })
  ]
});

// Create a function to log messages to a file
function logToFile(message) {
  fs.appendFile('log.txt', message + '\n', (err) => {
    if (err) {
      console.error(err);
    }
  });
}

// Create a function to stream logs from a file to clients
function streamLogs(res) {
  const logStream = fs.createReadStream('log.txt', {
    follow: true,
    logger: console
  });

  logStream.on('line', (line) => {
    res.write(`data: ${line}\n\n`);
  });

//   res.on('close', () => {
//     logStream.unwatch();
//   });
}

// Export the logger, logToFile, and streamLogs functions
module.exports = { logger, logToFile, streamLogs };
