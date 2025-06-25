import dotenv from 'dotenv';
dotenv.config();

export const llmConfig = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    vectorStore: {
        directory: './data/vectorstore',
    },
    tutorSchedule: {
        filePath: './data/tutor_schedules.txt',
    }
};

export const systemPrompt = `You are a scheduling assistant that helps match tutors with students based on their availability and subject expertise.
You must follow these rules:
1. Only suggest matches where the tutor is available (free hours)
2. Consider the tutor's subject expertise
3. Consider the tutor's grade level expertise
4. Return matches in the specified JSON format
5. If no valid matches are found, return an empty array
6. All times should be in 24-hour format
7. Days should be capitalized (Monday, Tuesday, etc.)`; 