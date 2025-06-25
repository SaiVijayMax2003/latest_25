import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from '../../../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();
// Setup pathss
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../../../data/tutor_schedules_archive");

// Replace these with your actual Assistant ID and Vector Store ID
const ASSISTANT_ID=process.env.LLM_ASSISTANT_ID
const VECTOR_STORE_ID=process.env.VECTOR_STORE_ID// Ensure it starts with `vs_`

// Only initialize OpenAI if LLM_ENABLED is true and OPENAI_API_KEY is set
let openai = null;
if (process.env.LLM_ENABLED === 'true' && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export default async function uploadAndReplaceFiles(FILE_PATH) {
  if (!openai) {
    throw new Error('LLM features are disabled or OPENAI_API_KEY is not set.');
  }
  try {
    logger.info("📁 Uploading new file...");
    // Upload file
    const uploadedFile = await openai.files.create({
      file: fs.createReadStream(FILE_PATH),
      purpose: "assistants",
    });
    logger.info("✅ File uploaded:", { fileId: uploadedFile.id });

    // Add file to vector store
    await openai.vectorStores.fileBatches.createAndPoll(VECTOR_STORE_ID, {
      file_ids: [uploadedFile.id],
    });
    logger.info("✅ File added to vector store");

    // List all files in the vector store
    const { data: currentFiles } = await openai.vectorStores.files.list(VECTOR_STORE_ID);

    // Find old files (excluding the newly uploaded one)
    const filesToDelete = currentFiles
      .map(f => f.id)
      .filter(id => id !== uploadedFile.id);

    // Delete old files
    for (const fileId of filesToDelete) {
      await openai.vectorStores.files.del(VECTOR_STORE_ID, fileId);
      logger.info("🗑️ Deleted old file:", { fileId });
    }

    // Update assistant to use the vector store
    await openai.beta.assistants.update(ASSISTANT_ID, {
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            vector_store_ids: [VECTOR_STORE_ID],
          },
        },
      });

    logger.info("✅ Assistant updated with vector store");

    // Delete the local file after successful upload
    fs.readdir(OUTPUT_DIR, (err, files) => {
      if (err) {
        logger.error('Error reading the folder:', { error: err.message, stack: err.stack });
        return;
      }
    
      for (const file of files) {
        const filePath = path.join(OUTPUT_DIR, file);
        
        // Check if it's a file (not a directory)
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Error deleting file ${file}:`, { error: err.message, stack: err.stack });
            } else {
              logger.info(`Deleted file: ${file}`);
            }
          });
        }
      }
    });
      

  } catch (err) {
    logger.error("Error in uploadAndReplaceFiles:", err);
    throw err;
  }
}
