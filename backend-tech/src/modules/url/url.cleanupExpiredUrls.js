import TemporaryUrl from './url.schema.js'; // adjust path
import { logger } from '../../utils/logger.js';

const cleanupExpiredUrls = async () => {
  const now = new Date();
  try {
    const result = await TemporaryUrl.deleteMany({ expiry_at: { $lt: now } });
    logger.info(`Deleted ${result.deletedCount} expired URL(s).`);
  } catch (error) {
    logger.error('Error during expired URL cleanup:', { error: error.message, stack: error.stack });
  }
};

export default cleanupExpiredUrls;
