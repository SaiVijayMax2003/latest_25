import User from '../modules/users/users.model.js';
import { logger } from './logger.js';
import mongoose from 'mongoose';

let currentIndex = 0;
let assignees = [];
let lastFetch = null; 
let assigneeMap = new Map();

// Create a schema for storing round-robin state
const roundRobinStateSchema = new mongoose.Schema({
    key: { type: String, unique: true, default: 'round_robin_state' },
    last_assigned_index: { type: Number, default: 0 },
    last_updated: { type: Date, default: Date.now }
});

const RoundRobinState = mongoose.model('RoundRobinState', roundRobinStateSchema);

/**
 * Get or create round-robin state from database
 * @returns {Promise<Object>} Round-robin state object
 */
async function getRoundRobinState() {
    try {
        let state = await RoundRobinState.findOne({ key: 'round_robin_state' });
        if (!state) {
            state = new RoundRobinState({
                key: 'round_robin_state',
                last_assigned_index: 0,
                last_updated: new Date()
            });
            await state.save();
            logger.info('Created new round-robin state');
        }
        return state;
    } catch (error) {
        logger.error('Error getting round-robin state:', error);
        // Fallback to default state
        return { last_assigned_index: 0, last_updated: new Date() };
    }
}

/**
 * Update round-robin state in database
 * @param {number} index - The new index to store
 */
async function updateRoundRobinState(index) {
    try {
        await RoundRobinState.findOneAndUpdate(
            { key: 'round_robin_state' },
            { 
                last_assigned_index: index,
                last_updated: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        logger.error('Error updating round-robin state:', error);
    }
}

/**
 * Get all users with is_assignee=true
 * @returns {Promise<Array>} Array of assignee users
 */
async function getAllAssignees() {
    try {
        const users = await User.find(
            { is_order_eligible: true },
            { user_id: 1, name: 1, role: 1, _id: 0 }
        );
        
        logger.info(`Found ${users.length} assignees`);
        return users;
    } catch (error) {
        logger.error('Error fetching assignees:', error);
        throw new Error('Failed to fetch assignees');
    }
}

/**
 * Get next assignee using round-robin algorithm with persistent state
 * @returns {Promise<Object|null>} Next assignee object with user_id and name, or null if no assignees
 */
async function getNextAssignee() {
    try {
        const now = Date.now();
        // Refresh assignees list every 5 minutes or if empty
        if (!lastFetch || (now - lastFetch) > 300000 || assignees.length === 0) {
            assignees = await getAllAssignees();
            lastFetch = now;
            
            // Load the last assigned index from database
            const state = await getRoundRobinState();
            currentIndex = state.last_assigned_index;
            
            // Ensure currentIndex is within bounds
            if (assignees.length > 0 && currentIndex >= assignees.length) {
                currentIndex = 0;
                await updateRoundRobinState(currentIndex);
            }
        }

        if (assignees.length === 0) {
            logger.warn('No assignees available');
            return null;
        }

        // Get current assignee
        const assignee = assignees[currentIndex];
        
        // Move to next assignee (round-robin)
        const nextIndex = (currentIndex + 1) % assignees.length;
        currentIndex = nextIndex;
        
        // Update the state in database
        await updateRoundRobinState(currentIndex);

        logger.info(`Round-robin assigned to: ${assignee.name} (${assignee.user_id}) at index ${currentIndex - 1}`);

        return {
            user_id: assignee.user_id,
            name: assignee.name,
            role: assignee.role
        };
    } catch (error) {
        logger.error('Error getting next assignee:', error);
        throw new Error('Failed to get next assignee');
    }
}

export { getNextAssignee, getAllAssignees };
