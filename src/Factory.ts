import express from 'express';
import { Server } from './loaders/Server';
import { MongoDB } from './loaders/MongoDB';
import logger from './loaders/Logger';

/**
 * Composition root. Constructs infrastructure (Express app, DB loader) and
 * hands them to the Server singleton. Keeping wiring here means app.ts stays a
 * thin bootstrap and dependencies are assembled in exactly one place.
 */
export class Factory {
  static InitializeServer(): Server {
    logger.info('Factory.InitializeServer');
    const app = express();
    const mongodb = new MongoDB();
    return Server.getInstance(app, mongodb);
  }
}
