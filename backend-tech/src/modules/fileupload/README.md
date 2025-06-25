# File Upload Module

This module provides file upload and download APIs for images, PDFs, and other files, using DigitalOcean Spaces as the storage backend.

## Endpoints

### POST `/fileupload/upload`
- Upload a file (image, PDF, etc.)
- Returns `{ url, key }` for the uploaded file
- Schedules deletion after 24 hours if not linked to a student

### GET `/fileupload/download/:key`
- Downloads or streams the file (image viewer or download)
- Uses a signed URL for secure access

### POST `/fileupload/cleanup`
- (Internal) Placeholder for cleaning up files not linked to any student after 24 hours
- In production, implement logic to scan and delete orphaned files

## How Scheduled Deletion Works
- When a file is uploaded, it is scheduled for deletion after 24 hours (in-memory for demo; use DB/queue for production)
- If the file is linked to a student (i.e., the student form is submitted and the file key is saved in MongoDB), you should cancel the scheduled deletion (not implemented in this demo)
- If the form is not submitted, the file will be deleted automatically after 24 hours

## Storage
- Uses DigitalOcean Spaces (S3-compatible)
- Configure credentials in `.env`:
  - `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`, `DO_SPACES_ENDPOINT`

## Usage
- Register the routes in your main Fastify app:
  ```js
  import fileuploadRoutes from './modules/fileupload';
  fastify.register(fileuploadRoutes);
  ```

- On student form submit, save the file `url` or `key` in the student document
- On form cancel/timeout, let the scheduled deletion remove the file 