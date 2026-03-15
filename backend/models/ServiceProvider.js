const mongoose = require('mongoose');

const ServiceProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    serviceType: { type: String, enum: ['Pre-camp speakers', 'Ndundu Speaker', 'Priest', 'Catering', 'Tents', 'Muratina'], required: true },
    contactEmail: { type: String, required: true },
    phone: { type: String, required: true },
}, {timestamps: true})

module.exports = mongoose.model('ServiceProvider', ServiceProviderSchema);