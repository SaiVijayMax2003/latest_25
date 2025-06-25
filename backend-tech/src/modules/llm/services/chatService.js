import OpenAI from 'openai';
import { llmConfig } from '../config/config.js';

class ChatService {
    constructor() {
        this.openai = null;
        this.assistantId = process.env.LLM_ASSISTANT_ID;
        this.threads = new Map(); // Store thread IDs
        this.maxSystemMessages = 20;
    }

    async initialize() {
        if (!this.openai) {
            this.openai = new OpenAI({
                apiKey: llmConfig.openai.apiKey
            });
        }
    }

    async createChatThread() {
        await this.initialize();
        try {
            const thread = await this.openai.beta.threads.create();
            console.log('Created new thread:', {
                threadId: thread.id,
                createdAt: thread.created_at
            });
            this.threads.set(thread.id, {
                threadId: thread.id,
                messages: []
            });
            return thread.id;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    formatScheduleResponse(response) {
        try {
            console.log('Raw response from ChatGPT:', response);
            
            // Handle response that's an object with content array
            let jsonContent;
            if (typeof response === 'object' && response.content) {
                if (Array.isArray(response.content)) {
                    // If content is an array, get the first text content
                    const textContent = response.content.find(item => item.type === 'text');
                    if (textContent && textContent.text) {
                        jsonContent = textContent.text.value;
                    }
                } else if (typeof response.content === 'string') {
                    jsonContent = response.content;
                }
            } else if (typeof response === 'string') {
                jsonContent = response;
            }

            if (!jsonContent) {
                throw new Error('No valid content found in response');
            }

            console.log('Content to parse:', jsonContent);
            
            let scheduleArray;
            // Try to parse as direct JSON first
            try {
                scheduleArray = JSON.parse(jsonContent);
            } catch (e) {
                // If direct parsing fails, try to extract from markdown code block
            const jsonMatch = jsonContent.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                    throw new Error('No valid JSON found in response');
                }
                const extractedJson = jsonMatch[1].trim();
                scheduleArray = JSON.parse(extractedJson);
            }
            
            console.log('Parsed schedule array:', scheduleArray);
            
            // Format into a more structured response
            const formattedSchedule = scheduleArray.map(session => ({
                tutor_id: session.tutorId,
                subject: session.subject,
                day: session.day,
                time: session.hour || session.time // Handle both 'hour' and 'time' fields
            }));

            console.log('Formatted schedule:', formattedSchedule);
            
            return {
                success: true,
                response: formattedSchedule
            };
        } catch (error) {
            console.error('Error formatting schedule response:', error);
            console.error('Raw response:', response);
            return {
                success: false,
                error: 'Failed to parse schedule response',
                rawResponse: response
            };
        }
    }

    async sendMessage(threadId, userMessage) {
        await this.initialize();

        if (!this.threads.has(threadId)) {
            throw new Error('Chat thread not found');
        }

        try {
            console.log('Sending message to thread:', {
                threadId,
                message: userMessage
            });

            // Add message to thread
            const message = await this.openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: userMessage
            });
            console.log('Message added to thread:', {
                messageId: message.id,
                role: message.role,
                content: message.content,
                fullContent: JSON.stringify(message.content, null, 2)
            });

            // Create a run
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId
            });
            console.log('Created run:', {
                runId: run.id,
                status: run.status,
                assistantId: this.assistantId
            });

            // Wait for the run to complete
            let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
            console.log('Initial run status:', runStatus.status);

            while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
                console.log('Updated run status:', runStatus.status);
            }

            if (runStatus.status === 'completed') {
                // Get the messages
                const messages = await this.openai.beta.threads.messages.list(threadId);
                const assistantMessage = messages.data[0].content[0].text.value;
                console.log('Assistant response:', {
                    messageId: messages.data[0].id,
                    content: assistantMessage,
                    fullContent: JSON.stringify(messages.data[0].content, null, 2)
                });

                // Update thread history
                const thread = this.threads.get(threadId);
                thread.messages.push({
                    role: 'user',
                    content: userMessage
                });
                thread.messages.push({
                    role: 'assistant',
                    content: assistantMessage
                });

                // Format the response
                const formattedResponse = this.formatScheduleResponse(assistantMessage);
                console.log('Formatted response:', formattedResponse);
                return formattedResponse;

            } else {
                console.error('Run failed:', runStatus);
                throw new Error(`Run failed with status: ${runStatus.status}`);
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }

    getThreadHistory(threadId) {
        if (!this.threads.has(threadId)) {
            throw new Error('Chat thread not found');
        }
        const history = this.threads.get(threadId).messages;
        console.log('Retrieved thread history:', {
            threadId,
            messageCount: history.length
        });
        return history;
    }

    async deleteThread(threadId) {
        if (!this.threads.has(threadId)) {
            throw new Error('Chat thread not found');
        }
        try {
            const result = await this.openai.beta.threads.del(threadId);
            console.log('Deleted thread:', {
                threadId,
                deleted: result.deleted
            });
            this.threads.delete(threadId);
        } catch (error) {
            console.error('Error deleting thread:', error);
            throw error;
        }
    }
}

export const chatService = new ChatService(); 