const mongoose = require('mongoose');

const MenteeSchema = new mongoose.Schema({
    admissionNumber: { 
        type: String, 
        required: true, 
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
                return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
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
    profilepic: { 
        type: String 
    },
}, { timestamps: true }); // ✅ Correct placement

// Auto-generate admission number before saving (if not provided)
MenteeSchema.pre('save', async function(next) {
    if (!this.admissionNumber) {
        // Generate format: MOR-YYYY-0001
        const year = new Date().getFullYear();
        const count = await mongoose.model('Mentee').countDocuments();
        const nextNumber = String(count + 1).padStart(4, '0');
        this.admissionNumber = `MOR-${year}-${nextNumber}`;
    }
    next();
});

module.exports = mongoose.model('Mentee', MenteeSchema);