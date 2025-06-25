export function convertTo24Hour(time12h) {
    // Handle case where time is already in 24-hour format
    if (!time12h.includes('AM') && !time12h.includes('PM')) {
        return time12h;
    }

    // Handle formats like "12:00PM" or "12:00 PM"
    const timeStr = time12h.replace(/(AM|PM)/, ' $1').replace(/\s+/g, ' ').trim();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);

    if (hours === 12) {
        hours = modifier === 'AM' ? 0 : 12;
    } else if (modifier === 'PM') {
        hours = hours + 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export function convertTo12Hour(time24h) {
    // Handle case where time is already in 12-hour format
    if (time24h.includes('AM') || time24h.includes('PM')) {
        return time24h;
    }

    const [hours24, minutes] = time24h.split(':');
    let hours = parseInt(hours24);
    let modifier = 'AM';

    if (hours === 0) {
        hours = 12;
    } else if (hours === 12) {
        modifier = 'PM';
    } else if (hours > 12) {
        hours = hours - 12;
        modifier = 'PM';
    }

    return `${hours.toString().padStart(2, '0')}:${minutes} ${modifier}`;
} 