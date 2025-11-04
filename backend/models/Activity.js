const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: [
            'mentee_created', 'mentee_updated', 'mentee_deleted',
            'cohort_created', 'cohort_updated', 'cohort_deleted',
            'event_created', 'event_updated', 'event_deleted',
            'mentor_created', 'mentor_updated', 'mentor_deleted',
            'parent_created', 'parent_updated', 'parent_deleted',
            'service_provider_created', 'service_provider_updated', 'service_provider_deleted',
            'user_created', 'user_verified', 'user_login'
        ], 
        required: true 
    },
    description: { type: String, required: true },
    entityType: { 
        type: String, 
        enum: ['Mentee', 'Cohort', 'Event', 'Mentor', 'Parent', 'ServiceProvider', 'User'], 
        required: true 
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    entityName: { type: String, required: true },
    user: { type: String }, // Optional: if you have user authentication
    metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data like old/new values
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);