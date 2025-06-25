import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

console.log('DO_SPACES_ENDPOINT:', process.env.DO_SPACES_ENDPOINT);

const endpoint = process.env.DO_SPACES_ENDPOINT;
const region = process.env.DO_SPACES_REGION || 'us-east-1';
const BUCKET = process.env.DO_SPACES_BUCKET;

const s3Client = new S3Client({
  endpoint: endpoint.startsWith('https://') ? endpoint : `https://${endpoint}`,
  region,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  }
});

export async function uploadFile(buffer, originalname, mimetype, bucket = BUCKET, visibility = 'private') {
  const key = `uploads/onboarding/${Date.now()}_${originalname}`;
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ACL: visibility === 'public' ? 'public-read' : 'private',
    ContentType: mimetype
  };
  try {
    await s3Client.send(new PutObjectCommand(params));
    // Remove protocol if present in endpoint for URL construction
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
    const url = `https://${bucket}.${cleanEndpoint}/${key}`;
    return { url, key };
  } catch (err) {
    console.error('Error uploading to Spaces:', err);
    throw err;
  }
}

export async function deleteFile(key, bucket = BUCKET) {
  const params = { Bucket: bucket, Key: key };
  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    console.error('Error deleting from Spaces:', err);
    throw err;
  }
}

export function getSignedUrl(key, expiresIn = 60 * 60, bucket = BUCKET) {
  // Not implemented for v3 SDK; use @aws-sdk/s3-request-presigner if needed
  const cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
  return `https://${bucket}.${cleanEndpoint}/${key}`;
}

// In-memory scheduled deletions (for demo; use DB/queue for production)
const scheduledDeletions = new Map();
export function scheduleFileDeletion(key, delayMs, bucket = BUCKET) {
  if (scheduledDeletions.has(key)) return;
  const timeout = setTimeout(() => {
    deleteFile(key, bucket).catch(() => {});
    scheduledDeletions.delete(key);
  }, delayMs);
  scheduledDeletions.set(key, timeout);
}

export { s3Client }; 