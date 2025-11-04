const mongoose = require('mongoose');

const MentorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    profession: { type: String, required: true },
    contactEmail: { type: String, required: true },
    phone: { type: String, required: true },
    profilepic: { type: String },
})

module.exports = mongoose.model('Mentor', MentorSchema);