import fileuploadService from './fileupload.service.js';
import entityLogger from '../../utils/entityLogger.js';

export const uploadFileHandler = async (request, reply) => {
  const file = request.file;
  if (!file) return reply.code(400).send({ error: 'No file uploaded' });
  
  // Get visibility from form data, default to 'private'
  const visibility = request.body?.visibility || 'private';
  
  // Validate visibility value
  if (visibility && !['public', 'private'].includes(visibility)) {
    return reply.code(400).send({ error: 'Invalid visibility value. Must be "public" or "private"' });
  }
  
  const result = await fileuploadService.uploadFile(file, visibility);
  
  // Log the file upload with entity logger
  await entityLogger.logEntityCreation('file_upload', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    visibility: visibility,
    key: result.key,
    url: result.url
  }, request.user?.id || 'system', request);
  
  return reply.send(result);
};

export const downloadFileHandler = async (request, reply) => {
  // Get key from either path parameter or query parameter
  const key = request.params['*'] || request.query.key;
  console.log('Download requested for key:', key);
  if (!key) {
    return reply.code(400).send({ error: 'No file key provided' });
  }
  
  // Log the file download with entity logger
  await entityLogger.logEntityUpdate('file_download', {
    key: key
  }, {
    key: key,
    downloaded_at: new Date().toISOString()
  }, request.user?.id || 'system', request);
  
  await fileuploadService.downloadFile(key, reply);
};

export const cleanupFilesHandler = async (request, reply) => {
  const result = await fileuploadService.cleanupFiles();
  return reply.send(result);
}; 