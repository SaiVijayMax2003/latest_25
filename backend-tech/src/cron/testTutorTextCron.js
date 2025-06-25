import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Daily at 1:00 AM

// testTutorTextCron.js
export function testTutorTextCron() {
    // ...
    cron.schedule('0 1 * * *', () => {
        const scriptPath = path.resolve(__dirname, '../modules/llm/utils/testTutorTextGenerator.js');
        logger.info(`Running schedule generator at ${new Date().toISOString()}`);
      
        exec(`node ${scriptPath}`, (err, stdout, stderr) => {
          if (err) {
            logger.error('Execution error:', { error: err.message, stack: err.stack });
            return;
          } 
          if (stderr) {
            logger.error('Script stderr:', { stderr });
          }
          logger.info('Script output:', { stdout });
        });
    });
    logger.info('Scheduled job initialized...');
}

