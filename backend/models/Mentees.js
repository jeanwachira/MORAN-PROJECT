const mongoose = require('mongoose');

const MenteeSchema = new mongoose.Schema({
    name: { type: String, required: true},
    cohort: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
    email: { type: String, required: true},
    dob: { type: Date, required: true },
    schoolSystem: { type: String, enum: ['8-4-4', 'IGCSE', 'CBC'], required: true },
    grade: { type: String, required: true },
    phone: { type: String, required: true },
    school: { type: String, required: true },
    parents: { type: [mongoose.Schema.Types.ObjectId], ref: 'Parents', required: true },
    procedure: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorEmail: { type: String, required: true },
    profilepic: { type: String },
})

module.exports = mongoose.model('Mentee', MenteeSchema);