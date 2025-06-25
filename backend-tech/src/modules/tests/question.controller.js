import QuestionService from './question.service.js';
import { logger } from '../../utils/logger.js';

class QuestionController {
  // Create a new question
  async createQuestion(request, reply) {
    try {
      const questionData = request.body;
      const question = await QuestionService.createQuestion(questionData);
      
      logger.info(`Question created successfully: ${question.question_id}`);
      
      return reply.code(201).send({
        success: true,
        message: 'Question created successfully',
        data: question
      });
    } catch (error) {
      logger.error('Error creating question:', error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  }

  // Get all questions with optional filters
  async getQuestions(request, reply) {
    try {
      const { type, topic, page = 1, limit = 10 } = request.query;
      const filters = {};
      
      if (type) filters.type = type;
      if (topic) filters.topic = { $regex: topic, $options: 'i' };
      
      const questions = await QuestionService.getQuestions(filters, parseInt(page), parseInt(limit));
      
      return reply.code(200).send({
        success: true,
        message: 'Questions retrieved successfully',
        data: questions
      });
    } catch (error) {
      logger.error('Error retrieving questions:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error retrieving questions'
      });
    }
  }

  // Get question by ID
  async getQuestionById(request, reply) {
    try {
      const { question_id } = request.params;
      const question = await QuestionService.getQuestionById(question_id);
      
      if (!question) {
        return reply.code(404).send({
          success: false,
          message: 'Question not found'
        });
      }
      
      return reply.code(200).send({
        success: true,
        message: 'Question retrieved successfully',
        data: question
      });
    } catch (error) {
      logger.error('Error retrieving question:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error retrieving question'
      });
    }
  }

  // Update question
  async updateQuestion(request, reply) {
    try {
      const { question_id } = request.params;
      const updateData = request.body;
      
      const question = await QuestionService.updateQuestion(question_id, updateData);
      
      if (!question) {
        return reply.code(404).send({
          success: false,
          message: 'Question not found'
        });
      }
      
      logger.info(`Question updated successfully: ${question_id}`);
      
      return reply.code(200).send({
        success: true,
        message: 'Question updated successfully',
        data: question
      });
    } catch (error) {
      logger.error('Error updating question:', error);
      return reply.code(400).send({
        success: false,
        message: error.message
      });
    }
  }

  // Delete question
  async deleteQuestion(request, reply) {
    try {
      const { question_id } = request.params;
      const deleted = await QuestionService.deleteQuestion(question_id);
      
      if (!deleted) {
        return reply.code(404).send({
          success: false,
          message: 'Question not found'
        });
      }
      
      logger.info(`Question deleted successfully: ${question_id}`);
      
      return reply.code(200).send({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting question:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error deleting question'
      });
    }
  }
}

export default new QuestionController();
