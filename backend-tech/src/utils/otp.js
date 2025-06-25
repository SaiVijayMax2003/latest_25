import crypto from 'crypto';

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateUniqueHash(phoneNumber) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return crypto
        .createHash('sha256')
        .update(`${phoneNumber}${timestamp}${randomBytes}`)
        .digest('hex');
} 