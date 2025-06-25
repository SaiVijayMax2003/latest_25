import User from '../modules/users/users.model.js';

/**
 * Get user details from database using user_id
 * @param {string} user_id - User ID
 * @returns {Promise<Object>} User details object
 */
async function getUserDetailsFromDB(user_id) {
    try {
        const user = await User.findOne({ user_id }, { name: 1, username: 1, _id: 0 });
        return user || null;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
}

/**
 * Get user details from JWT token and database
 * @param {Object} request - Fastify request object
 * @returns {Promise<Object>} User details object
 */
export async function getUserDetailsFromJWT(request) {
    try {
        const user = request.user || {};
        const user_id = user.user_id || null;
        
        // Get additional details from database if user_id exists
        let dbDetails = null;
        if (user_id) {
            dbDetails = await getUserDetailsFromDB(user_id);
        }

        return {
            user_id: user_id,
            role: user.role || null,
            username: dbDetails?.username || null,
            name: dbDetails?.name || null,
            created_at: new Date()
        };
    } catch (error) {
        // Return minimal object if there's any error
        return {
            user_id: null,
            role: null,
            username: null,
            name: null,
            created_at: new Date()
        };
    }
} 