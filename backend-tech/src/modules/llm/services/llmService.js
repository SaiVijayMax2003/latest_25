import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { llmConfig, systemPrompt } from '../config/config.js';
import { chatService } from './chatService.js';
import { generateSchedulePrompt } from '../utils/promptGenerator.js';
import axios from 'axios';
import { convertTo24Hour } from '../utils/timeUtils.js';
import TutorService from '../../tutor/tutor.service.js';
import { mongoService } from './mongoService.js';
import entityLogger from '../../../utils/entityLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class LLMService {
    constructor() {
        this.initialized = false;
        this.model = null;
        this.chatModel = null;
        this.embeddings = null;
        this.maxConflictMessages = 2;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.chatModel = new ChatOpenAI({
                openAIApiKey: llmConfig.openai.apiKey
            });
            this.embeddings = new OpenAIEmbeddings({
                openAIApiKey: llmConfig.openai.apiKey,
            });
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing LLM service:', error);
            throw error;
        }
    }

    async testOpenAIConnection() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const response = await this.chatModel.call([
                new SystemMessage("You are a helpful assistant."),
                new HumanMessage("Hello! Can you confirm you're working?")
            ]);
            return {
                success: true,
                message: response.content
            };
        } catch (error) {
            console.error('Error testing OpenAI connection:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility to format conflicts as a string
    formatConflicts(conflicts) {
        return conflicts.map(c => {
            const t = c.conflict;
            return `TutorId ${t.tutor_id} has conflict on day ${t.day} and hour ${convertTo24Hour(t.time)}`;
        }).join('\n');
    }

    async findScheduleMatches(studentRequirements, previous_response = null, userContext = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Create a new chat thread
            const threadId = await chatService.createChatThread();
            entityLogger.logEntityUpdate('schedule_matching',
                { student_id: studentRequirements.student_id },
                { thread_id: threadId, action: 'thread_created' },
                userContext.user_id || 'system',
                userContext.request
            );

            // Generate the prompt using promptGenerator
            const prompt = generateSchedulePrompt({
                grade: studentRequirements.grade,
                subjects: studentRequirements.subjects,
                availability: studentRequirements.availability,
                specializations: studentRequirements.specializations,
                rules: studentRequirements.rules,
                extra: studentRequirements.extra,
                previous_response: previous_response ? (typeof previous_response === 'string' ? previous_response : JSON.stringify(previous_response)) : undefined
            });

            // Send the message and get the response
            const response = await chatService.sendMessage(threadId, prompt);

            // Add tutor_name to each entry in the response
            if (response.success && Array.isArray(response.response)) {
                const tutorService = new TutorService();
                for (const entry of response.response) {
                    if (entry.tutor_id) {
                        const tutorNameObj = await tutorService.getTutorNameById(entry.tutor_id);
                        entry.tutor_name = tutorNameObj ? tutorNameObj.tutor_name : undefined;
                    }
                }
                // Fire-and-forget: store the generated schedule in MongoDB
                (async () => {
                    try {
                        const user_id = userContext.user_id !== undefined ? userContext.user_id : null;
                        const role = userContext.role !== undefined ? userContext.role : null;
                        await mongoService.insertGeneratedSchedule({
                            user_id,
                            role,
                            student_id: studentRequirements.student_id,
                            thread_id: threadId,
                            created_time: new Date(),
                            request_params: studentRequirements,
                            response: response.response
                        });
                    } catch (err) {
                        entityLogger.logEntityUpdate('schedule_matching',
                            { student_id: studentRequirements.student_id, thread_id: threadId },
                            { error: 'Failed to store generated schedule', error_message: err.message },
                            userContext.user_id || 'system',
                            userContext.request
                        );
                    }
                })();
            }

            // Clean up the thread
            await chatService.deleteThread(threadId);
            entityLogger.logEntityUpdate('schedule_matching',
                { student_id: studentRequirements.student_id },
                { thread_id: threadId, action: 'thread_cleaned_up' },
                userContext.user_id || 'system',
                userContext.request
            );

            return response;
        } catch (error) {
            entityLogger.logEntityUpdate('schedule_matching',
                { student_id: studentRequirements.student_id },
                { error: 'Error finding schedule matches', error_message: error.message },
                userContext.user_id || 'system',
                userContext.request
            );
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createSchedule({
        student_id,
        grade,
        subjects,
        availability,
        specializations,
        rules = '',
        extra = ''
    }) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Create a new chat thread
            const threadId = await chatService.createChatThread();
            entityLogger.logEntityUpdate('schedule_creation',
                { student_id },
                { thread_id: threadId, action: 'thread_created' },
                'system',
                null
            );

            // Generate the prompt using promptGenerator
            const prompt = generateSchedulePrompt({
                grade,
                subjects,
                availability,
                specializations,
                rules,
                extra
            });

            // Send the message and get the response
            const response = await chatService.sendMessage(threadId, prompt);

            // Clean up the thread
            await chatService.deleteThread(threadId);
            entityLogger.logEntityUpdate('schedule_creation',
                { student_id },
                { thread_id: threadId, action: 'thread_cleaned_up' },
                'system',
                null
            );

            return response;
        } catch (error) {
            entityLogger.logEntityUpdate('schedule_creation',
                { student_id },
                { error: 'Error creating schedule', error_message: error.message },
                'system',
                null
            );
            throw error;
        }
    }
}

export const llmService = new LLMService(); 