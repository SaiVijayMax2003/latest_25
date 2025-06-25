import DemoSession from './demosession.schema.js';
class DemoSessionService {
  constructor(fastify) {
    this.fastify = fastify;
    this.demoSessionModel = DemoSession;
  }
   async createDemoSession(sessionData) {
    try {
      const demosession_id = sessionData.tutor_id + Date.now();
      const session = new DemoSession({
        ...sessionData,
        demosession_id
      });
      return await session.save();
    } catch(error){
      throw new Error(`Failed to create demo session: ${error.message}`);
    }
  }
  async getDemoSessionById(demosession_id) {
    return DemoSession.findOne({ demosession_id: Number(demosession_id) });
  }
  
  async getAllDemoSessions(filters = {}) {
    try {
      return await DemoSession.find(filters).sort({ preferred_date: 1 });
    } catch (error) {
      throw new Error(`Failed to fetch demo sessions: ${error.message}`);
    }
  }
  
  async updateDemoSession(demosession_id, updateData) {
    try {
     const session = await this.getDemoSessionById(demosession_id);
     if(!session){
      throw new Error('Demo session not found');
     }
     const updatedSession = await DemoSession.findOneAndUpdate(
      { demosession_id: Number(demosession_id) },
      { $set: updateData },
      { new: true }
     );
     return {
      success: true,
      data: updatedSession
     }
     


    } catch (error) {
      throw new Error(`Failed to update demo session: ${error.message}`);
    }
  }
  
  async deleteDemoSession(demosession_id) {
    return await DemoSession.findOneAndDelete({ demosession_id: Number(demosession_id) });
  }
  
  async getExpiredDemoSessions() {
    try {
      return await DemoSession.find({ expired: true });
    } catch (error) {
      throw new Error(`Failed to fetch expired demo sessions: ${error.message}`);
    }
  }
  
   async getUpcomingDemoSessions() {
    try {
      return await DemoSession.find({ expired: false }).sort({ preferred_date: 1 });
    } catch (error) {
      throw new Error(`Failed to fetch upcoming demo sessions: ${error.message}`);
    }


  } 

  /**
   * Checks all demo sessions and sets expired: true if their preferred_date and preferred_time are before now.
   */
  async checkAndExpireSessions() {
    const now = new Date();
    // Find sessions where preferred_date + preferred_time is before now and not already expired
    const sessions = await DemoSession.find({ expired: false });
    for (const session of sessions) {
      // Combine preferred_date and preferred_time into a Date object
      const date = session.preferred_date;
      const [hours, minutes] = (session.preferred_time || '00:00').split(':').map(Number);
      const sessionDateTime = new Date(date);
      sessionDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      if (sessionDateTime < now) {
        session.expired = true;
        await session.save();
      }
    }
    return { success: true };
  }

}
export default DemoSessionService;