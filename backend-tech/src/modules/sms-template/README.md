# SMS Template Module

This module provides a template-based SMS sending system similar to the email template module. It allows you to send SMS messages using predefined templates with dynamic parameters.

## Features

- Template-based SMS sending
- Parameter validation
- Bulk SMS sending
- Error handling and logging
- MSG91 integration

## Available Templates

The following SMS templates are available:

### 1. Welcome Template
- **Template Name**: `WELCOME`
- **Required Parameters**:
  - `phone`: Phone number (10 digits)
  - `student_name`: Student's name (will replace ##var1## in the message)
- **Message**: "Hello ##var1##, Welcome to NNIIT Family. Every great achievement begins with the first step - and you've just taken yours. Let's conquer your goals together one session at a time! GSNA Education Private Limited"

### 2. Schedule Generated Template
- **Template Name**: `SCHEDULE_GENERATED`
- **Required Parameters**:
  - `phone`: Phone number (10 digits)
  - `student_name`: Student's name (will replace ##var1## in the message)
- **Message**: "Hello ##var1##, We have shared your learning schedule link on the email provided. Please confirm the schedule on the link to proceed with the on-boarding. - GSNA EDUCATION PRIVATE LIMITED"

## How Variables Work

### Template Variables Explained:
- **`##var1##`** in the template message is a placeholder
- This placeholder gets replaced with the value you provide in the `student_name` parameter
- **Example**: If you send `student_name: "John Doe"`, then `##var1##` becomes "John Doe"

### Variable Replacement Examples:

**Welcome SMS:**
- Template: `"Hello ##var1##, Welcome to NNIIT Family..."`
- If `student_name: "John Doe"` → Result: `"Hello John Doe, Welcome to NNIIT Family..."`

**Schedule SMS:**
- Template: `"Hello ##var1##, We have shared your learning schedule..."`
- If `student_name: "John Doe"` → Result: `"Hello John Doe, We have shared your learning schedule..."`

## API Usage

### Send Welcome SMS

**Endpoint**: `POST /sms/send-template`

**Request Body**:
```json
{
  "template_name": "WELCOME",
  "params": {
    "phone": "9999999999",
    "student_name": "John Doe"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "request_id_from_msg91"
}
```

### Send Schedule Generated SMS

**Request Body**:
```json
{
  "template_name": "SCHEDULE_GENERATED",
  "params": {
    "phone": "9999999999",
    "student_name": "John Doe"
  }
}
```

## Environment Variables

Make sure to set the following environment variables:

```env
# MSG91 Configuration
MSG91_API_KEY=your_msg91_api_key

# SMS Template IDs
MSG91_WELCOME_SMS_TEMPLATE_ID=your_welcome_template_id
MSG91_SCHEDULE_GENERATED_SMS_TEMPLATE_ID=your_schedule_template_id
```

## MSG91 Template Setup

For the SMS templates to work properly, you need to set up the templates in MSG91 with:

### Welcome Template:
1. **Template ID**: Set this in your environment variable `MSG91_WELCOME_SMS_TEMPLATE_ID`
2. **Template Content**: 
   ```
   Hello ##var1##, Welcome to NNIIT Family. Every great achievement begins with the first step - and you've just taken yours. Let's conquer your goals together one session at a time! GSNA Education Private Limited
   ```

### Schedule Generated Template:
1. **Template ID**: Set this in your environment variable `MSG91_SCHEDULE_GENERATED_SMS_TEMPLATE_ID`
2. **Template Content**: 
   ```
   Hello ##var1##, We have shared your learning schedule link on the email provided. Please confirm the schedule on the link to proceed with the on-boarding. - GSNA EDUCATION PRIVATE LIMITED
   ```

### Important Notes:
- Use `##var1##` in your MSG91 template
- The `student_name` parameter in your API request will replace `##var1##` in the message
- This follows the same pattern as the email template system

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: SMS sent successfully
- `400`: Invalid template name or missing required parameters
- `500`: SMS service configuration error or API failure

## Examples

### Send Welcome SMS
```javascript
const response = await fetch('/sms/send-template', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template_name: 'WELCOME',
    params: {
      phone: '9999999999',
      student_name: 'John Doe'
    }
  })
});

const result = await response.json();
console.log(result);
// Output: { success: true, message: "SMS sent successfully", messageId: "..." }
```

### Send Schedule Generated SMS
```javascript
const response = await fetch('/sms/send-template', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template_name: 'SCHEDULE_GENERATED',
    params: {
      phone: '9999999999',
      student_name: 'John Doe'
    }
  })
});
```

### Using the SMS Service Directly
```javascript
import { smsService } from './sms.service.js';

// Send welcome SMS
const welcomeResult = await smsService.sendSms('WELCOME', {
  phone: '9999999999',
  student_name: 'John Doe'
});

// Send schedule SMS
const scheduleResult = await smsService.sendSms('SCHEDULE_GENERATED', {
  phone: '9999999999',
  student_name: 'John Doe'
});

console.log(welcomeResult);
console.log(scheduleResult);
```

## Testing

You can test the SMS configuration using the service method:

```javascript
import { smsService } from './sms.service.js';

const result = await smsService.testSmsConfig();
console.log(result);
``` 