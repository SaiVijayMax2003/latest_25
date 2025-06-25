import mongoose from 'mongoose';

const studentFormSchema = new mongoose.Schema({
    questions: [{
        question_id: {
            type: Number,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ['short_text', 'long_text', 'select', 'radio', 'checkbox', 'date', 'number', 'email', 'phone', 'file', 'calendar']
        },
        options: [{
            value: String,
            label: String
        }],
        required: {
            type: Boolean,
            default: false
        },
        placeholder: String,
        validation: {
            pattern: String,
            minLength: Number,
            maxLength: Number,
            min: Number,
            max: Number
        }
    }],
    default_questions: {
        type: Array,
        default: [
            {
                question_id: 1,
                name: 'id_no',
                label: 'ID No.',
                type: 'short_text',
                required: true
            },
            {
                question_id: 2,
                name: 'date',
                label: 'Date',
                type: 'date',
                required: true
            },
            {
                question_id: 3,
                name: 'student_name',
                label: 'Student Name',
                type: 'short_text',
                required: true
            },
            {
                question_id: 4,
                name: 'parent_guardian_name',
                label: 'Parent/Guardian\'s Name',
                type: 'short_text',
                required: true
            },
            {
                question_id: 5,
                name: 'gender',
                label: 'Gender',
                type: 'radio',
                required: true,
                options: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ]
            },
            {
                question_id: 6,
                name: 'date_of_birth',
                label: 'Date of Birth',
                type: 'date',
                required: true
            },
            {
                question_id: 7,
                name: 'address',
                label: 'Address',
                type: 'long_text',
                required: true
            },
            {
                question_id: 8,
                name: 'city',
                label: 'City',
                type: 'short_text',
                required: true
            },
            {
                question_id: 9,
                name: 'state',
                label: 'State',
                type: 'short_text',
                required: true
            },
            {
                question_id: 10,
                name: 'country',
                label: 'Country',
                type: 'short_text',
                required: true
            },
            {
                question_id: 11,
                name: 'pin_code',
                label: 'Pin Code',
                type: 'short_text',
                required: true,
                validation: {
                    pattern: '^[0-9]{6}$',
                    minLength: 6,
                    maxLength: 6
                }
            },
            {
                question_id: 12,
                name: 'student_mobile',
                label: 'Student Mobile Number',
                type: 'phone',
                required: true,
                placeholder: '+91',
                validation: {
                    pattern: '^\\+91[0-9]{10}$'
                }
            },
            {
                question_id: 13,
                name: 'parent_mobile',
                label: 'Parent Mobile Number',
                type: 'phone',
                required: true,
                placeholder: '+91',
                validation: {
                    pattern: '^\\+91[0-9]{10}$'
                }
            },
            {
                question_id: 14,
                name: 'student_email',
                label: 'Student Email Id',
                type: 'email',
                required: true
            },
            {
                question_id: 15,
                name: 'parent_email',
                label: 'Parent\'s Email Id',
                type: 'email',
                required: false
            },
            {
                question_id: 16,
                name: 'school_college_name',
                label: 'School/College Name',
                type: 'short_text',
                required: true
            },
            {
                question_id: 17,
                name: 'current_grade',
                label: 'Current Grade/Class',
                type: 'short_text',
                required: true
            },
            {
                question_id: 18,
                name: 'stream',
                label: 'Stream',
                type: 'short_text',
                required: false
            },
            {
                question_id: 19,
                name: 'syllabus',
                label: 'Syllabus Opted For',
                type: 'radio',
                required: true,
                options: [
                    { value: 'cbse', label: 'CBSE' },
                    { value: 'icse', label: 'ICSE' },
                    { value: 'ssc', label: 'SSC' },
                    { value: 'others', label: 'OTHERS' }
                ]
            },
            {
                question_id: 20,
                name: 'classes_per_week',
                label: 'Classes per Week',
                type: 'radio',
                required: true,
                options: [
                    { value: '3', label: '3 Classes per Month' },
                    { value: '4', label: '4 Classes per Month' },
                    { value: '6', label: '6 Classes per Week' },
                    { value: '12', label: '12 Classes per Week' }
                ]
            }
        ]
    }
}, {
    timestamps: true,
    collection: 'student_form_collection',
    dbName: process.env.MONGODB_DBNAME
});

export default mongoose.model('FormField', studentFormSchema);
