import { createFeedback } from '../student/student.service.js';

// Test feedback creation
async function testFeedbackCreation() {
  try {
    console.log('Testing feedback creation...\n');

    const feedbackData = {
      student_id: 1, // Replace with an actual student ID from your database
      user_id: 123,
      type: 'test',
      text: 'This is a test feedback message'
    };

    const result = await createFeedback(feedbackData);
    console.log('Feedback created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing feedback creation:', error);
    throw error;
  }
}

// Example usage:
// testFeedbackCreation();

export { testFeedbackCreation }; 