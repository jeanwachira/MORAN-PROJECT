const mongoose = require('mongoose');

const ParentsSchema = new mongoose.Schema({
    parent: { type: String, enum: ['Father', 'Mother'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    mentee: { type: [mongoose.Schema.Types.ObjectId], ref: 'Mentee', required: true },
})

module.exports = mongoose.model('Parents', ParentsSchema);