import { Factory } from './Factory';
import logger from './loaders/Logger';

// Fail loudly on programming errors instead of leaving the process in a bad state.
process
  .on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${String(reason)}`);
  })
  .on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    logger.error(err.stack || '');
    process.exit(1);
  });

async function startServer(): Promise<void> {
  try {
    logger.info('Init');
    const server = Factory.InitializeServer();
    await server.start();
  } catch (error) {
    logger.error(`Error occurred while starting the app: ${String(error)}`);
    process.exit(1);
  }
}

void startServer();
