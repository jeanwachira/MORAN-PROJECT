const mongoose = require('mongoose');

const CohortSchema = new mongoose.Schema({
    riika: { type: String, required: true },
    year: { type: Number, required: true },
    residence: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
})

module.exports = mongoose.model('Cohort', CohortSchema);