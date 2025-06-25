import Question from './question.schema.js';
import { logger } from '../../utils/logger.js';

class QuestionService {
  // Create a new question
  async createQuestion(questionData) {
    try {
      // Auto-generate question_id based on type
      const questionId = await this.getNextQuestionId(questionData.type);
      
      // Create question with auto-generated ID
      const question = new Question({
        ...questionData,
        question_id: questionId
      });
      
      const savedQuestion = await question.save();
      return savedQuestion;
    } catch (error) {
      logger.error('Error in createQuestion service:', error);
      throw error;
    }
  }

  // Get all questions with filters and pagination
  async getQuestions(filters = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const questions = await Question.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const total = await Question.countDocuments(filters);
      
      return {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getQuestions service:', error);
      throw error;
    }
  }

  // Get question by ID
  async getQuestionById(questionId) {
    try {
      const question = await Question.findOne({ question_id: questionId }).lean();
      return question;
    } catch (error) {
      logger.error('Error in getQuestionById service:', error);
      throw error;
    }
  }

  // Update question
  async updateQuestion(questionId, updateData) {
    try {
      // Remove question_id from update data to prevent changing it
      const { question_id, ...dataToUpdate } = updateData;
      
      const question = await Question.findOneAndUpdate(
        { question_id: questionId },
        dataToUpdate,
        { new: true, runValidators: true }
      );
      
      return question;
    } catch (error) {
      logger.error('Error in updateQuestion service:', error);
      throw error;
    }
  }

  // Delete question
  async deleteQuestion(questionId) {
    try {
      const result = await Question.findOneAndDelete({ question_id: questionId });
      return result;
    } catch (error) {
      logger.error('Error in deleteQuestion service:', error);
      throw error;
    }
  }

  // Get next question ID for a given type
  async getNextQuestionId(type) {
    try {
      const typeToPrefix = {
        'maths': 'M',
        'physics': 'P',
        'chemistry': 'C',
        'biology': 'B'
      };
      
      const prefix = typeToPrefix[type.toLowerCase()];
      if (!prefix) {
        throw new Error('Invalid question type');
      }
      
      // Find the highest question ID for this type
      const lastQuestion = await Question.findOne({
        question_id: { $regex: `^${prefix}` }
      }).sort({ question_id: -1 });
      
      let nextNumber = 1;
      if (lastQuestion) {
        const lastNumber = parseInt(lastQuestion.question_id.substring(1));
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      logger.error('Error in getNextQuestionId service:', error);
      throw error;
    }
  }

  // Bulk create questions
  async bulkCreateQuestions(questionsData) {
    try {
      const questions = await Question.insertMany(questionsData, { 
        ordered: false,
        rawResult: true 
      });
      return questions;
    } catch (error) {
      logger.error('Error in bulkCreateQuestions service:', error);
      throw error;
    }
  }

  // Get question statistics
  async getQuestionStats() {
    try {
      const stats = await Question.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            topics: { $addToSet: '$topic' }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            uniqueTopics: { $size: '$topics' }
          }
        }
      ]);
      
      const totalQuestions = await Question.countDocuments();
      
      return {
        totalQuestions,
        byType: stats
      };
    } catch (error) {
      logger.error('Error in getQuestionStats service:', error);
      throw error;
    }
  }
}

export default new QuestionService();
