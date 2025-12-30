import winston from 'winston';
import fs from 'fs';
import path from 'path';
import configs from '../../configs/config';

// Create logs directory if it doesn't exist
const logsDirValue = configs.getValue('LOGS_DIR', false) || '.logs';
const logDir = path.join(__dirname, `../../${logsDirValue}`);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure transports based on environment
const transports: winston.transport[] = [];

if (!configs.isProduction()) {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({ level, message, timestamp, stack }) =>
            `${timestamp} [${level}]: ${stack || message}`
        )
      ),
    })
  );
}

if (configs.isProduction()) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

export default logger;
