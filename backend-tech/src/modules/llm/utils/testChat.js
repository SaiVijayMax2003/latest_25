import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:3000/api/llm/chat';

const testMessage = `I am a Grade 11 student preparing for IIT JEE. I need the following classes every week:

Maths – 2 sessions
Physics – 2 sessions
Chemistry – 2 sessions

🕓 My available time slots are:

Monday at 17:00
Monday at 18:00
Tuesday at 17:00
Tuesday at 18:00
Wednesday at 17:00
Wednesday at 18:00
Thursday at 17:00
Thursday at 18:00
Friday at 17:00
Friday at 18:00
Saturday at 17:00

Please provide the schedule in the following JSON format:
[
  {
    "subject": "Subject Name",
    "tutorId": "Tutor ID",
    "day": "Day of Week",
    "time": "Time in HH:MM format"
  }
]`;

async function saveResponseToFile(data, filename) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'modules', 'llm', 'utils', filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`Response saved to ${filename}`);
    } catch (error) {
        console.error('Error saving response to file:', error);
    }
}

async function getAndStoreResponse() {
    try {
        // Create thread
        const createResponse = await axios.post(`${BASE_URL}/threads`, {}, {
            headers: { 'Content-Type': 'application/json' }
        });
        const threadId = createResponse.data.threadId;

        // Send message
        const messageResponse = await axios.post(`${BASE_URL}/threads/${threadId}/messages`, {
            message: testMessage
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Save responses
        await saveResponseToFile(messageResponse.data, 'message_response.json');
        await saveResponseToFile(createResponse.data, 'thread_create.json');

        // Get and save thread history
        const historyResponse = await axios.get(`${BASE_URL}/threads/${threadId}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        await saveResponseToFile(historyResponse.data, 'thread_history.json');

        // Cleanup
        await axios.delete(`${BASE_URL}/threads/${threadId}`, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        if (error.response) {
            await saveResponseToFile(error.response.data, 'error_response.json');
        }
    }
}

// Run
getAndStoreResponse(); 