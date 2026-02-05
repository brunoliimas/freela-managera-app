import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
    level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
    transport: !isProduction && !isTest
        ? {
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
              },
          }
        : undefined,
});

export default logger;
