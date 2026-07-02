import { createLogger, format, transports } from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, splat } = format;

const line = printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`);

const logger = createLogger({
  level: config.logs.level,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), splat()),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), line),
    }),
  ],
});

export default logger;
