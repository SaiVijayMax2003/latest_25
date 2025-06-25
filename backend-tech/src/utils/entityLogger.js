import { getUserDetailsFromJWT } from './getUserDetails.js';

class EntityLogger {
    constructor() {
        this.fastify = null;
    }

    setFastify(fastify) {
        this.fastify = fastify;
    }

    async getUserContext(request) {
        if (!request) return { user_id: 'system', role: 'system', username: 'system', name: 'system' };
        
        try {
            const userDetails = await getUserDetailsFromJWT(request);
            return {
                user_id: userDetails.user_id || 'system',
                role: userDetails.role || 'system',
                username: userDetails.username || 'system',
                name: userDetails.name || 'system'
            };
        } catch (error) {
            if (this.fastify) {
                this.fastify.log.error('Error getting user context:', error);
            }
            return { user_id: 'system', role: 'system', username: 'system', name: 'system' };
        }
    }

    formatLogEntry(type, entityName, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            entityName,
            ...data
        };

        // Log using Fastify logger for basic message
        if (this.fastify) {
            this.fastify.log.info(`${type} ${entityName}`, logEntry);
        } else {
            // Fallback to console.log with structured format for production
            console.log(JSON.stringify({
                level: 'info',
                timestamp,
                message: `${type} ${entityName}`,
                ...logEntry
            }));
        }
        
        // Log detailed information using console.log to ensure visibility
       
        return logEntry;
    }

    async logEntityCreation(entityName, newData, userId, request = null) {
        const userContext = await this.getUserContext(request);
        const logEntry = this.formatLogEntry('CREATE', entityName, {
            newData,
            ...userContext,
            action: 'Entity Created',
            ip: request?.ip,
            userAgent: request?.headers['user-agent'],
            requestId: request?.id
        });
    }

    async logEntityUpdate(entityName, oldData, newData, userId, request = null) {
        const userContext = await this.getUserContext(request);
        // Calculate changes
        const changes = {};
        for (const key in newData) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                changes[key] = {
                    from: oldData[key],
                    to: newData[key]
                };
            }
        }

        const logEntry = this.formatLogEntry('UPDATE', entityName, {
            oldData,
            newData,
            changes,
            ...userContext,
            action: 'Entity Updated',
            ip: request?.ip,
            userAgent: request?.headers['user-agent'],
            requestId: request?.id
        });
    }

    async logEntityDeletion(entityName, deletedData, userId, request = null) {
        const userContext = await this.getUserContext(request);
        const logEntry = this.formatLogEntry('DELETE', entityName, {
            deletedData,
            ...userContext,
            action: 'Entity Deleted',
            ip: request?.ip,
            userAgent: request?.headers['user-agent'],
            requestId: request?.id
        });
    }

    async logEntityStatusChange(entityName, oldStatus, newStatus, userId, request = null) {
        const userContext = await this.getUserContext(request);
        const logEntry = this.formatLogEntry('STATUS_CHANGE', entityName, {
            oldStatus,
            newStatus,
            ...userContext,
            action: 'Status Changed',
            ip: request?.ip,
            userAgent: request?.headers['user-agent'],
            requestId: request?.id
        });
    }

    async logEntityScheduleChange(entityName, oldSchedule, newSchedule, userId, request = null) {
        const userContext = await this.getUserContext(request);
        const logEntry = this.formatLogEntry('SCHEDULE_CHANGE', entityName, {
            oldSchedule,
            newSchedule,
            ...userContext,
            action: 'Schedule Changed',
            ip: request?.ip,
            userAgent: request?.headers['user-agent'],
            requestId: request?.id
        });
    }
}

export default new EntityLogger();
