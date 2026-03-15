const mongoose = require('mongoose');
const ServiceProvider = require('./ServiceProvider');

const EventsSchema = new mongoose.Schema({
    EventType: { type: String, enum: ['Ithemba', 'Junior Moran', 'Cut-to-ID', 'Alumni'], required: true },
    EventDate: { type: Date, required: true },
    ServiceProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true }],
}, {timestamps: true})

module.exports = mongoose.model('Events', EventsSchema);