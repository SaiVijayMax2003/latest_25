import cron from 'node-cron';
import { storeUtilizationData } from '../modules/admin/admin.storeUtilization.js';

export function setupUtilizationCron(fastify) {
    // Run daily at 1 AM
    cron.schedule('0 1 * * *', async () => {
        try {
            // Store daily utilization data
            fastify.log.info('Starting daily utilization data storage...');
            await storeUtilizationData(fastify, 'daily');
            fastify.log.info('Completed daily utilization data storage');

            // Store hourly utilization data
            fastify.log.info('Starting hourly utilization data storage...');
            await storeUtilizationData(fastify, 'hourly');
            fastify.log.info('Completed hourly utilization data storage');
        } catch (error) {
            fastify.log.error('Error in utilization cron job:', error);
        }
    });

    // // Run every hour
    // cron.schedule('0 1 * * *', async () => {
    //     try {
    //         fastify.log.info('Starting hourly utilization data storage...');
    //         await storeUtilizationData(fastify, 'hourly');
    //         fastify.log.info('Completed hourly utilization data storage');
    //     } catch (error) {
    //         fastify.log.error('Error in hourly utilization cron job:', error);
    //     }
    // });

    fastify.log.info('Utilization cron jobs scheduled: daily and hourly at 1:00 AM');
} 
