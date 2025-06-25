import { convertTo24Hour } from './timeUtils.js';

export function generateSchedulePrompt({ 
    grade, 
    subjects, 
    availability, 
    specializations, 
    previous_response,
    tail, 
    rules = '', 
    extra = '' 
}) {
    // Format subjects as bullet points
    const subjectLines = subjects.map(subject => 
        `- ${subject.subject} – ${subject.classes} sessions`
    ).join('\n');

    // Format availability: one line per day, comma-separated slots
    const availabilityLines = availability.map(day => {
        const slots = day.slots.map(slot => convertTo24Hour(slot)).join(', ');
        return `${day.day} at ${slots}`;
    }).join('\n');

    // Format specializations
    const specializationsList = specializations.join(', ');

    // Default instruction block
    const instructionBlock = `Please assign tutors who:
- Have matching slots in their Free Hours
- Are qualified for Grade ${grade} and experienced in ${specializationsList}
- Are not overloaded (prefer tutors with more free hours and less utilization)
- Keep the same tutor per subject
- Do not assign any class outside my available time slots
- Make sure no two subjects are assigned at the same time
- Return valid tutor IDs starting with 20xxx
- Subjects can be assigned in any order; do not assume the order listed is the scheduling order`;

    // Format rules and extra
    const rulesAndExtra = [rules, extra].filter(Boolean).join('\n');

    // Previous schedule text
    let previousText = '';
    if (previous_response) {
        previousText = `The previous generated schedule is: ${previous_response}`;
    }

    // Tail text
    let tailText = '';
    if (tail) {
        tailText = tail + (rulesAndExtra ? `\n${rulesAndExtra}` : '');
    }

    // Compose the prompt
    const prompt = `Student is a Grade ${grade} student preparing for ${specializationsList}. I need the following classes every week:
${subjectLines}
\nMy available time slots are:
${availabilityLines}
\n${instructionBlock}
${rulesAndExtra ? '\n' + rulesAndExtra : ''}
${previousText ? '\n' + previousText : ''}${tailText ? '\n' + tailText : ''}
\nReturn only the final schedule in valid JSON with the following format:
[
  {
    "tutorId": number,
    "subject": string,
    "day": string,
    "hour": string
  }
]`;

    return prompt;
} 