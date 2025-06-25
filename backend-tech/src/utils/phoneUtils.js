const { countryCodes, phoneNumberPatterns } = require('../config/sms');

class PhoneValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PhoneValidationError';
  }
}

const validatePhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if the number starts with a country code
  if (cleanNumber.startsWith(countryCodes.india)) {
    const numberWithoutCode = cleanNumber.slice(countryCodes.india.length);
    if (!phoneNumberPatterns.india.test(numberWithoutCode)) {
      throw new PhoneValidationError('Invalid Indian phone number format');
    }
    return {
      country: 'india',
      number: numberWithoutCode,
      fullNumber: cleanNumber
    };
  }
  
  if (cleanNumber.startsWith(countryCodes.us)) {
    const numberWithoutCode = cleanNumber.slice(countryCodes.us.length);
    if (!phoneNumberPatterns.us.test(numberWithoutCode)) {
      throw new PhoneValidationError('Invalid US phone number format');
    }
    return {
      country: 'us',
      number: numberWithoutCode,
      fullNumber: cleanNumber
    };
  }

  throw new PhoneValidationError('Unsupported country code or invalid phone number format');
};

const formatPhoneNumber = (phoneNumber) => {
  const { country, fullNumber } = validatePhoneNumber(phoneNumber);
  return fullNumber;
};

const detectCountry = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.startsWith(countryCodes.india)) {
    return 'india';
  }
  if (cleanNumber.startsWith(countryCodes.us)) {
    return 'us';
  }
  throw new PhoneValidationError('Could not detect country from phone number');
};

module.exports = {
  validatePhoneNumber,
  formatPhoneNumber,
  detectCountry,
  PhoneValidationError,
}; 