import AWS from 'aws-sdk';

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'us-east-1',
});
const BUCKET = process.env.DO_SPACES_BUCKET;

/**
 * Upload a file to DigitalOcean Spaces
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Name of the file (e.g. myfile.pdf)
 * @param {string} folder - Folder path in bucket (e.g. 'uploads/pdfs')
 * @param {string} mimeType - MIME type (e.g. 'application/pdf')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadFile(buffer, fileName, folder = '', mimeType = 'application/octet-stream') {
  const Key = folder ? `${folder.replace(/\/$/, '')}/${fileName}` : fileName;
  const params = {
    Bucket: BUCKET,
    Key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: mimeType,
  };
  try {
    await s3.putObject(params).promise();
    return getFileUrl(fileName, folder);
  } catch (err) {
    throw new Error('Upload failed: ' + err.message);
  }
}

/**
 * Get the public URL for a file in Spaces
 * @param {string} fileName
 * @param {string} folder
 * @returns {string}
 */
export function getFileUrl(fileName, folder = '') {
  const Key = folder ? `${folder.replace(/\/$/, '')}/${fileName}` : fileName;
  return `https://${BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${Key}`;
}

/**
 * Delete a file from Spaces
 * @param {string} fileName
 * @param {string} folder
 * @returns {Promise<void>}
 */
export async function deleteFile(fileName, folder = '') {
  const Key = folder ? `${folder.replace(/\/$/, '')}/${fileName}` : fileName;
  const params = {
    Bucket: BUCKET,
    Key,
  };
  try {
    await s3.deleteObject(params).promise();
  } catch (err) {
    throw new Error('Delete failed: ' + err.message);
  }
}

/**
 * Download a file from Spaces
 * @param {string} fileName
 * @param {string} folder
 * @returns {Promise<Buffer>} - File contents as a Buffer
 */
export async function getFile(fileName, folder = '') {
  const Key = folder ? `${folder.replace(/\/$/, '')}/${fileName}` : fileName;
  const params = {
    Bucket: BUCKET,
    Key,
  };
  try {
    const data = await s3.getObject(params).promise();
    return data.Body; // Buffer
  } catch (err) {
    throw new Error('Get file failed: ' + err.message);
  }
} 