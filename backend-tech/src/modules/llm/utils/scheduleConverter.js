import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function convertTutorSchedulesToText(tutors) {
    let textContent = '';

    for (const tutor of tutors) {
        textContent += `Tutor ${tutor.tutorId}:\n`;
        textContent += `Subjects: ${tutor.subjects.join(' | ')}\n`;
        textContent += `Grades: ${tutor.grades.join(', ')}\n`;
        textContent += `Current classes: ${tutor.currentClasses}\n\n`;

        textContent += 'Free Hours:\n';
        for (const slot of tutor.freeHours) {
            textContent += `- ${slot.day} at ${slot.hour}\n`;
        }
        textContent += '\n';

        textContent += 'Unavailable Hours:\n';
        for (const slot of tutor.unavailableHours) {
            textContent += `- ${slot.day} at ${slot.hour}\n`;
        }
        textContent += '\n\n';
    }

    const filePath = path.join(__dirname, '../../../data/tutor_schedules.txt');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, textContent);
    return filePath;
}

export function formatTimeTo24Hour(time) {
    const [timeStr, period] = time.split(' ');
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);

    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
} 