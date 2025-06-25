import mongoose from 'mongoose';
import TutorSchedule from '../../tutor/tutor.schema.js';
import { writeAllTutorsScheduleFile, getScheduleFileVersions } from './tutorTextGenerator.js';
import uploadAndReplaceFiles from './uploadAndReplaceFiles.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


// Load .env.development if MONGODB_URI is not set
if (!process.env.MONGODB_URI) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.join(__dirname, '../../../../.env.development') });
}

async function main() {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('Already connected to MongoDB');
  } else {
    // Connect to MongoDB with dbName if provided
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    
    if (process.env.MONGODB_DBNAME) {
      connectOptions.dbName = process.env.MONGODB_DBNAME;
    }
    await mongoose.connect(process.env.MONGODB_URI, connectOptions);
    console.log('Connected to MongoDB');
  }

  try {
    // Generate a new versioned schedule file for all tutors
    const filePath = await writeAllTutorsScheduleFile();
    // Get the list of current schedule file versions
    const versions = await getScheduleFileVersions();
    console.log(`Generated schedule file: ${filePath}`);
    console.log('Current schedule file versions:', versions);

    // Upload and replace files in vector store
    // await uploadAndReplaceFiles();
    
    return { latest_file: filePath, versions };
  } catch (err) {
    console.error('Error:', err.message);
    return { error: err.message };
  } finally {
    // Only disconnect if we created the connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

main().then(results => {
  console.log('Done:', results);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 