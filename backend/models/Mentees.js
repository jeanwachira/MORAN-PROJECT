const mongoose = require('mongoose');

const BILLING_CUTOFF = new Date('2026-07-01'); // Auto-billing starts from July 2026

const MenteeSchema = new mongoose.Schema({
    admissionNumber: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    cohort: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cohort',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    dob: {
        type: Date,
        required: true
    },
    schoolSystem: {
        type: String,
        enum: ['8-4-4', 'IGCSE', 'CBC'],
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Accepts: 07XX XXX XXX, +2547XX, 2547XX, (254)7XX, etc.
                return /^(\+?254|0)[17]\d{8}$/.test(v.replace(/[\s\-().]/g, ''));
            },
            message: props => `${props.value} is not a valid Kenyan phone number! Use 07XX XXX XXX or +2547XX XXX XXX`
        }
    },
    school: {
        type: String,
        required: true
    },
    parents: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Parents',
        required: true
    },
    // Medical notes (free-text)
    procedure: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    doctorEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    // Billing program type
    programType: {
        type: String,
        enum: ['circumcision_and_mentorship', 'mentorship_only'],
        required: true
    },
    profilepic: {
        type: String
    },
}, { timestamps: true });

// Export billing cutoff for use in controller
MenteeSchema.statics.BILLING_CUTOFF = BILLING_CUTOFF;

// Auto-generate admission number before saving (if not provided)
MenteeSchema.pre('save', async function(next) {
    if (!this.admissionNumber) {
        try {
            const year = new Date().getFullYear();
            const count = await mongoose.model('Mentee').countDocuments();
            const nextNumber = String(count + 1).padStart(4, '0');
            this.admissionNumber = `MOR-${year}-${nextNumber}`;
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Mentee', MenteeSchema);