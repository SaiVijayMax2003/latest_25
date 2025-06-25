import FeedbackService from './feedback.service.js';
 // Assuming you're using this too

class FeedbackController {
  constructor(fastify) {
    this.fastify = fastify;     
    this.feedbackService = new FeedbackService(fastify); 
  }

  async createFeedback(request, reply) {
    try {
      const feedbackData = request.body;

      // Basic validation
      if (!feedbackData.tutor_id) {
        return reply.code(400).send({ 
          success: false, 
          error: 'Required fields are missing: tutor_id, user_id, type' 
        });
      }

      // Validate that either rating or text is provided
      if (!feedbackData.rating && !feedbackData.text) {
        return reply.code(400).send({ 
          success: false, 
          error: 'Either rating or text must be provided' 
        });
      }

      const result = await this.feedbackService.createFeedback(feedbackData);

      return reply.code(201).send({
        success: true,
        message: 'Feedback created successfully',
        feedback: result.data
      });
    } catch (error) {
      this.fastify.log.error(error);
      return reply.code(400).send({ 
        success: false, 
        error: error.message || 'Failed to create feedback' 
      });
    }
  }

  async getFeedbackByTutorId(request, reply) {
    try {
      const { tutorId } = request.params;
      
      if (!tutorId) {
        return reply.code(400).send({ 
          success: false, 
          error: 'Tutor ID is required' 
        });
      }

      const result = await this.feedbackService.getFeedbackByTutorId(tutorId);

      return reply.code(200).send({
        success: true,
        feedback: result.data
      });
    } catch (error) {
      this.fastify.log.error(error);
      return reply.code(400).send({ 
        success: false, 
        error: error.message || 'Failed to get feedback' 
      });
    }
  }
}

export default FeedbackController;
