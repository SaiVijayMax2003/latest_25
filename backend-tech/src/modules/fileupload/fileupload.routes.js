import { uploadFileHandler, downloadFileHandler } from './fileupload.controller.js';
import multer from 'fastify-multer';
import { generateInvoiceAndUploadOnly, getStudentInvoiceData, sendInvoiceEmailByStudentId } from '../../utils/invoice.js';
import { addPaymentToOrder } from '../order/order.service.js';
import { sendEmailViaMsg91 } from '../../utils/email.js';
const upload = multer({ storage: multer.memoryStorage() });

export default async function fileuploadRoutes(fastify) {
  // File upload route using fastify-multer
  fastify.post('/upload', { 
    preHandler: upload.single('file'),
    schema: {
      tags: ['fileservice'],
      summary: 'Upload a file to DigitalOcean Spaces',
      description: 'Uploads a file and returns its URL and key. Files can be set as public or private. Send as multipart/form-data with "file" field and optional "visibility" field.',
      response: {
        200: {
          description: 'File uploaded successfully',
          type: 'object',
          properties: {
            url: { type: 'string' },
            key: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return uploadFileHandler(request, reply);
  });

  // Download by key parameter
  fastify.get('/download', {
    schema: {
      tags: ['fileservice'],
      summary: 'Download a file from DigitalOcean Spaces using URL parameter',
      description: 'Streams the file for download or inline viewing using a key parameter.',
      querystring: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'File key (path) in Spaces' }
        },
        required: ['key']
      },
      response: {
        200: {
          description: 'The file stream',
          content: {
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' }
            }
          }
        },
        404: {
          description: 'File not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const key = request.query.key;
      if (!key) {
        return reply.code(400).send({ error: 'Key parameter is required' });
      }
      return downloadFileHandler(request, reply);
    }
  });

  // Original download route with path parameter
  fastify.get('/download/*', {
    schema: {
      tags: ['fileservice'],
      summary: 'Download a file from DigitalOcean Spaces',
      description: 'Streams the file for download or inline viewing.',
      params: {
        type: 'object',
        properties: {
          '*': { type: 'string', description: 'File key (path) in Spaces' }
        },
        required: ['*']
      },
      response: {
        200: {
          description: 'The file stream',
          content: {
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' }
            }
          }
        },
        404: {
          description: 'File not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: downloadFileHandler
  });

  // Invoice upload route
  fastify.post('/uploadinvoice', {
    schema: {
      tags: ['fileservice'],
      summary: 'Generate and upload an invoice',
      description: 'Generates and uploads an invoice PDF for the given student_id. Stores the invoice_url in the order collection.',
      body: {
        type: 'object',
        properties: {
          student_id: { 
            type: 'number', 
            description: 'Student ID for the order (required)' 
          }
        },
        required: ['student_id']
      },
      response: {
        200: {
          description: 'Invoice generated and uploaded successfully',
          type: 'object',
          properties: {
            invoiceUrl: { type: 'string' },
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    let invoiceData = request.body;
    
    // If only student_id is present, fetch the rest
    if (invoiceData.student_id || (!invoiceData.studentName || !invoiceData.email || !invoiceData.courses)) {
      try {
        invoiceData = await getStudentInvoiceData(invoiceData.student_id);
      } catch (err) {
        return reply.code(400).send({ success: false, error: err.message });
      }
    }
    
    if (invoiceData.student_id || (invoiceData.studentName || invoiceData.email || Array.isArray(invoiceData.courses) || invoiceData.courses.length > 0)) {
      try {
        const result = await generateInvoiceAndUploadOnly(invoiceData);
        if (result.success) {
          const { invoiceUrl } = result;
          if (invoiceData.student_id && invoiceUrl) {
            await addPaymentToOrder(invoiceData.student_id, { invoice_url: invoiceUrl });
          }
          // --- Send invoice email automatically ---
          try {
            await sendInvoiceEmailByStudentId(invoiceData.student_id, invoiceUrl);
          } catch (emailErr) {
            request.log && request.log.error ? request.log.error('Invoice email send failed:', emailErr) : console.error('Invoice email send failed:', emailErr);
            // Do not block main response
          }
          // --- End email logic ---
          return reply.send(result);
        } else {
          return reply.code(400).send(result);
        }
      } catch (error) {
        return reply.code(500).send({ success: false, error: error.message });
      }
    } else {
      return reply.code(400).send({ success: false, error: 'Invalid invoice data provided' });
    }
  });
} 