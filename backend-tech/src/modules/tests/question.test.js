import QuestionService from './question.service.js';

// Example usage of auto-generated question IDs
async function testQuestionCreation() {
  try {
    console.log('Testing auto-generation of question IDs...\n');

    // Test creating questions for different types
    const questionData1 = {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      ans: "4",
      type: "maths",
      topic: "Basic Arithmetic"
    };

    const questionData2 = {
      question: "What is the SI unit of force?",
      options: ["Newton", "Joule", "Watt", "Pascal"],
      ans: "Newton",
      type: "physics",
      topic: "Mechanics"
    };

    const questionData3 = {
      question: "What is the chemical symbol for gold?",
      options: ["Au", "Ag", "Fe", "Cu"],
      ans: "Au",
      type: "chemistry",
      topic: "Elements"
    };

    const questionData4 = {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"],
      ans: "Mitochondria",
      type: "biology",
      topic: "Cell Biology"
    };

    // Create questions (IDs will be auto-generated)
    const question1 = await QuestionService.createQuestion(questionData1);
    console.log('Maths question created with ID:', question1.question_id);

    const question2 = await QuestionService.createQuestion(questionData2);
    console.log('Physics question created with ID:', question2.question_id);

    const question3 = await QuestionService.createQuestion(questionData3);
    console.log('Chemistry question created with ID:', question3.question_id);

    const question4 = await QuestionService.createQuestion(questionData4);
    console.log('Biology question created with ID:', question4.question_id);

    // Test getting next question ID for each type
    console.log('\nNext question IDs for each type:');
    console.log('Maths:', await QuestionService.getNextQuestionId('maths'));
    console.log('Physics:', await QuestionService.getNextQuestionId('physics'));
    console.log('Chemistry:', await QuestionService.getNextQuestionId('chemistry'));
    console.log('Biology:', await QuestionService.getNextQuestionId('biology'));

  } catch (error) {
    console.error('Error testing question creation:', error);
  }
}

// Uncomment to run the test
// testQuestionCreation();

export { testQuestionCreation }; 