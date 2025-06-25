import cron from 'node-cron';
import cleanupExpiredUrls from '../modules/url/url.cleanupExpiredUrls.js'; // adjust path
import { logger } from '../utils/logger.js';

// Schedule the cron job to run every hour


// Inside url.cron.js
export default function urlCron() {
  cron.schedule('0 1 * * *', () => {
    logger.info('Running expired URL cleanup...');
    cleanupExpiredUrls();
  });
}
