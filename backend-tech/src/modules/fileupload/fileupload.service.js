import { uploadFile as doUploadFile } from '../../utils/fileUtils.js';
import FileUpload from './fileupload.model.js';
import AWS from 'aws-sdk';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../utils/fileUtils.js';
import entityLogger from '../../utils/entityLogger.js';

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'blr1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});
const BUCKET = process.env.DO_SPACES_BUCKET;

const fileuploadService = {
  async uploadFile(file, visibility = 'private') {
    const { url, key } = await doUploadFile(file.buffer, file.originalname, file.mimetype, BUCKET, visibility);
    
    // Create file record in database
    const fileRecord = await FileUpload.create({ key, url });
    
    // Log the file record creation
    await entityLogger.logEntityCreation('file_record', {
      key: fileRecord.key,
      url: fileRecord.url,
      uploadedAt: fileRecord.uploadedAt,
      linkedToStudent: fileRecord.linkedToStudent,
      studentId: fileRecord.studentId
    }, 'system');
    
    return { url, key };
  },
  async downloadFile(key, reply) {
    const params = { Bucket: BUCKET, Key: key };
    
    try {
      const command = new GetObjectCommand(params);
      const data = await s3Client.send(command);

      // Set headers
      reply.header('Content-Type', data.ContentType || 'application/octet-stream');
      reply.header('Content-Disposition', `attachment; filename=\"${key.split('/').pop()}\"`);

      // Convert stream to buffer and send
      const chunks = [];
      for await (const chunk of data.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      reply.send(buffer);
      
    } catch (err) {
      console.error('Spaces download error:', err);
      if (!reply.raw.headersSent) {
        reply.code(404).send({ error: 'File not found' });
      }
    }
  }
};

export default fileuploadService; 