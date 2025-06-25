import FeedbackModel from './feedback.schema.js';

class FeedbackService {
  constructor(fastify) {
    this.fastify = fastify;
    this.feedbackModel = FeedbackModel;
  }

  async createFeedback(data) {
    try {
      // Basic validation
      // Validate based on feedback type
      if (!data.rating && !data.text) {
        throw new Error('Either rating or text must be provided');
      }

      // Create new feedback
      const feedback = new this.feedbackModel({
        ...data,
        created_at: new Date()
      });
      const savedFeedback = await feedback.save();
      return {
        success: true,
        data: savedFeedback
      };
    } catch (error) {
      this.fastify.log.error('Error creating feedback:', error);
      throw error;
    }
  }
  async getFeedbackByTutorId(tutorId) {
    try {
      const feedback = await this.feedbackModel.find({ tutor_id: tutorId }).sort({ created_at: -1 });
      return {
        success: true,
        data: feedback
      };
    } catch (error) {
      this.fastify.log.error('Error getting feedback:', error);
      throw error;
    }
  }
}
export default FeedbackService;
