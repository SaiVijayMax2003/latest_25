import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TutorSchedule } from '../../tutor/tutor.schema.js';
import { convertTo24Hour } from './timeUtils.js';
import uploadAndReplaceFiles from './uploadAndReplaceFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../../data/tutor_texts');
const DO_NOT_USE_FIELDS = ['tutor_name', 'email', 'phone_number', 'old_details', 'additional_details','notice_period','status','gender','demo_eligibility'];

// Ensure data and tutor_texts directories exist
await fs.mkdir(path.join(__dirname, '../../../data'), { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

function formatField(key, value) {
  if (Array.isArray(value)) {
    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.join(', ')}`;
  }
  if (typeof value === 'object' && value !== null) {
    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${JSON.stringify(value)}`;
  }
  return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
}

function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatHours(hoursArr, isAllotted = false) {
  if (!Array.isArray(hoursArr)) return [];
  if (isAllotted) {
    // allotted_hours: [{ day, time, ... }]
    return hoursArr
      .filter(h => h && h.day && h.time)
      .map(h => `- ${capitalize(h.day)} at ${convertTo24Hour(h.time)}`);
  } else {
    // total_available_hours: [{ day, slots: [..] }]
    return hoursArr.flatMap(dayObj =>
      (dayObj && dayObj.day && Array.isArray(dayObj.slots) ? dayObj.slots : []).map(slot => `- ${capitalize(dayObj.day)} at ${convertTo24Hour(slot)}`)
    );
  }
}

function getFreeHours(totalAvailable, allotted) {
  // Flatten all available slots
  const allSlots = [];
  totalAvailable.forEach(dayObj => {
    (dayObj.slots || []).forEach(slot => {
      if (dayObj.day && slot) {
        allSlots.push({ day: dayObj.day, time: slot });
      }
    });
  });
  // Remove allotted slots
  const allottedSet = new Set(
    allotted
      .filter(a => a && a.day && a.time)
      .map(a => `${a.day.toLowerCase()}_${convertTo24Hour(a.time)}`)
  );
  return allSlots
    .filter(s => s.day && s.time && !allottedSet.has(`${s.day.toLowerCase()}_${convertTo24Hour(s.time)}`))
    .map(s => `- ${capitalize(s.day)} at ${convertTo24Hour(s.time)}`);
}


async function getAllTutors() {
  try {
    const tutors = await TutorSchedule.find({ status: 'active' }).lean();
    if (!tutors || tutors.length === 0) {
      console.error('No active tutors found in the database');
      return [];
    }
    return tutors;
  } catch (error) {
    console.error('Error fetching active tutors:', error);
    throw error;
  }
}

async function getTutorText(tutor) {
  // Skip if tutor is not active
  if (tutor.status !== 'active') {
    return '';
  }

  let text = `Tutor Id: ${tutor.tutor_id}:\n`;
  if (tutor.subjects) text += `Subjects: ${tutor.subjects.join(' | ')}\n`;
  if (tutor.grades) text += `Grades: ${tutor.grades.join(', ')}\n`;
  if (tutor.specializations) text += `Specialization: ${tutor.specializations.join(', ')}\n`;
  if (tutor.current_classes || tutor.currentClasses || tutor.total_slots) {
    text += `Current classes: ${tutor.current_classes || tutor.currentClasses || tutor.total_slots}\n`;
  }

  // Add days left until employment_end_date
  if (tutor.employment_end_date) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const endDate = new Date(tutor.employment_end_date);
    endDate.setHours(0,0,0,0);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    text += `Days left: ${diffDays >= 0 ? diffDays : 0}\n`;
  } else {
    text += `Days left: N/A\n`;
  }

  // Utilization percentage
  const totalAvailable = Array.isArray(tutor.total_available_hours)
    ? tutor.total_available_hours.reduce((sum, dayObj) => sum + (Array.isArray(dayObj.slots) ? dayObj.slots.length : 0), 0)
    : 0;
  const allotted = Array.isArray(tutor.allotted_hours) ? tutor.allotted_hours.length : 0;
  let utilization = 0;
  if (totalAvailable>0) {
    utilization = Math.round((allotted / totalAvailable) * 100);
  }
  text += `Utilization: ${utilization}%\n`;

  
  text += '\n';

  // Free and unavailable hours
  const freeHours = getFreeHours(tutor.total_available_hours || [], tutor.allotted_hours || []);
  const unavailableHours = formatHours(tutor.allotted_hours || [], true);

  text += 'Free Hours:\n';
  text += freeHours.length ? freeHours.join('\n') : 'None';
  text += '\n\n';

  text += 'Unavailable Hours:\n';
  text += unavailableHours.length ? unavailableHours.join('\n') : 'None';
  text += '\n\n';

  // Add all other fields except do_not_use_fields and already included
  const alreadyIncluded = new Set([
    'tutor_id', 'subjects', 'grades', 'specializations', 'current_classes', 'currentClasses', 'total_slots', 'total_available_hours', 'allotted_hours', '__v', 'createdAt', 'updatedAt', '_id', 'user_id', 'feedback', 'joining_date', 'status'
  ]);
  for (const [key, value] of Object.entries(tutor.toObject ? tutor.toObject() : tutor)) {
    if (DO_NOT_USE_FIELDS.includes(key) || alreadyIncluded.has(key)) continue;
    text += formatField(key, value) + '\n';
  }
  return text;
}

async function getVersionedScheduleFiles() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const files = (await fs.readdir(OUTPUT_DIR)).filter(f => f.startsWith('tutor_schedules_v') && f.endsWith('.txt'));
  files.sort();
  return files;
}
function getISTTimestamp() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(now.getTime() + istOffset);

  // Format YYYY-MM-DD_HH-MM-SS
  const formatted = istDate.toISOString().replace('T', '_').substring(0, 19).replace(/[:]/g, '-');
  return formatted;
}

export async function writeAllTutorsScheduleFile() {
  // Ensure all required directories exist
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const ARCHIVE_DIR = path.join(OUTPUT_DIR, '../tutor_schedules_archive');
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const tutors = await getAllTutors();
  if (!tutors || tutors.length === 0) {
    throw new Error('No active tutors found in the database');
  }

  let text = '';
  for (const tutor of tutors) {
    const tutorText = await getTutorText(tutor);
    if (tutorText) { // Only add non-empty text
      text += tutorText;
      text += '\n';
    }
  }

  // If no text was generated (no active tutors), throw error
  if (!text.trim()) {
    throw new Error('No active tutor data to write');
  }

  // Prepare file paths
  const currentFile = path.join(OUTPUT_DIR, 'tutor_schedules_current.txt');
  const prevFile = path.join(OUTPUT_DIR, 'tutor_schedules_prev.txt');
  const prev2File = path.join(OUTPUT_DIR, 'tutor_schedules_prev2.txt');

  // Write to a temp file first
  const tempFile = path.join(OUTPUT_DIR, 'tutor_schedules_temp.txt');
  await fs.writeFile(tempFile, text, 'utf-8');

  // Check if the new file is empty (size 0)
  const stats = await fs.stat(tempFile);
  if (stats.size === 0) {
    await fs.unlink(tempFile);
    throw new Error('Generated schedule file is empty. Aborting update.');
  }

  const timestamp = getISTTimestamp(); // For file names
  const archiveFile = path.join(ARCHIVE_DIR, `tutor_schedules_${timestamp}.txt`);
  await fs.copyFile(tempFile, archiveFile);

  // Cycle files: prev2 <- prev <- current <- new
  // Remove prev2 if exists
  try { await fs.unlink(prev2File); } catch {}
  // Move prev to prev2
  try { await fs.rename(prevFile, prev2File); } catch {}
  // Move current to prev
  try { await fs.rename(currentFile, prevFile); } catch {}
  // Move temp to current
  await fs.rename(tempFile, currentFile);

  // Ensure all file operations are complete before uploading
  await fs.access(currentFile);
  await fs.access(archiveFile);

  // Now upload the archived file
  await uploadAndReplaceFiles(archiveFile);

  return currentFile;
}

export async function getScheduleFileVersions() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const files = ['tutor_schedules_current.txt', 'tutor_schedules_prev.txt', 'tutor_schedules_prev2.txt'];
  const filesWithTimestamps = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(OUTPUT_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        return {
          file,
          createdAt: stats.birthtime,
          size: stats.size
        };
      } catch {
        return null;
      }
    })
  );
  return filesWithTimestamps.filter(Boolean);
} 
