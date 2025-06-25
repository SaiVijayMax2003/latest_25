import { generateSchedulePrompt } from './promptGenerator.js';

// Test data
const testData = {
    grade: '8',
    subjects: [
        { subject: 'physics', classes: '2' },
        { subject: 'physics', classes: '3' }
    ],
    availability: [
        { 
            day: 'monday', 
            slots: ['12:00PM', '8:00PM', '9:30AM'] // Testing different formats
        },
        {
            day: 'tuesday',
            slots: ['01:00PM', '07:00PM'] // Testing with leading zeros
        }
    ],
    specializations: ['JEE', 'NEET'],
    extra: 'Make sure to give json'
};

// Generate and log the prompt
const prompt = generateSchedulePrompt(testData);
console.log('Generated Prompt:\n', prompt);

// Test with custom tail
const customTail = `Please assign tutors who:
    Are qualified for Grade 10
    Have experience in JEE and NEET
    Can teach physics
    Are available during the specified times
    Return schedule in JSON format.`;

const promptWithCustomTail = generateSchedulePrompt({
    ...testData,
    tail: customTail
});

console.log('\nGenerated Prompt with Custom Tail:\n', promptWithCustomTail); 