import { AdminService } from './admin.service.js';

export class AdminController {
    constructor(fastify) {
        this.fastify = fastify;
        this.adminService = new AdminService(fastify);
    }

    async getTutorUtilization(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.adminService.getTutorUtilization(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({
                success: false,
                error: error.message
            });
        }
    }

    async getOverallUtilization(request, reply) {
        try {
            const result = await this.adminService.getOverallUtilization(request);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    }

    async getHourUtilization(request, reply) {
        try {
            const { day, time } = request.query;
            const result = await this.adminService.getHourUtilization(day, time);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    }

    async getDetailedTutorUtilization(request, reply) {
        try {
            const { tutorId } = request.params;
            const result = await this.adminService.getDetailedTutorUtilization(tutorId);
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(404).send({
                success: false,
                error: error.message
            });
        }
    }

    async getSubjectWiseUtilization(request, reply) {
        try {
            const result = await this.adminService.getSubjectWiseUtilization();
            return reply.code(200).send(result);
        } catch (error) {
            this.fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    }
}
