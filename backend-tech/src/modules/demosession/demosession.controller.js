import DemoSessionService from './demosession.service.js';

const demoSessionService = new DemoSessionService();

export async function postDemoSession(request, reply) {
  try {
    const user_id = request.user?.user_id || request.user?.id;
    if (!user_id) {
      return reply.code(401).send({ success: false, error: 'Unauthorized: user_id missing from token' });
    }
    const session = await demoSessionService.createDemoSession({ ...request.body, user_id });
    reply.code(201).send({ success: true, data: session });
  } catch (error) {
    reply.code(400).send(
      { success: false, error: error.message });
  }
}

export async function getDemoSession(request, reply) {
  try {
    const { demosession_id } = request.params;
    const session = await demoSessionService.getDemoSessionById(demosession_id);
    reply.code(200).send({ success: true, data: session });
  } catch (error) {
    reply.code(404).send({ success: false, error: error.message });
  }
}

export async function getAllSessions(request, reply) {
  try {
    const filters = request.query;
    const sessions = await demoSessionService.getAllDemoSessions(filters);
    reply.code(200).send({ success: true, data: sessions });
  } catch (error) {
    reply.code(400).send({ success: false, error: error.message });
  }
}

export async function updateSession(request, reply) {
  try {
    const { demosession_id } = request.params;
    const session = await demoSessionService.updateDemoSession(demosession_id, request.body);
    reply.code(200).send({ success: true, data: session });
  } catch (error) {
    reply.code(400).send({ success: false, error: error.message });
  }
}

export async function deleteSession(request, reply) {
  try {
    const { demosession_id } = request.params;
    const session = await demoSessionService.deleteDemoSession(demosession_id);
    reply.code(200).send({ success: true, data: session });
  } catch (error) {
    reply.code(404).send({ success: false, error: error.message });
  }
}

export async function getExpiredSessions(request, reply) {
  try {
    const sessions = await demoSessionService.getExpiredDemoSessions();
    reply.code(200).send({ success: true, data: sessions });
  } catch (error) {
    reply.code(400).send({ success: false, error: error.message });
  }
}

export async function getUpcomingSessions(request, reply) {
  try {
    const sessions = await demoSessionService.getUpcomingDemoSessions();
    reply.code(200).send({ success: true, data: sessions });
  } catch (error) {
    reply.code(400).send({ success: false, error: error.message });
  }
}

