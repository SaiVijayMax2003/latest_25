import DemoSessionService from '../modules/demosession/demosession.service.js';
import cron from 'node-cron';
import { logger } from '../utils/logger.js';


export default function demosessionCron() {
  cron.schedule('0 1 * * *', () => {
    logger.info('Running expired demo session cleanup...');
    DemoSessionService.checkAndExpireSessions();
  });
}