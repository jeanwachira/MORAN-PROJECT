const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Import routes
const parentRoutes = require('./routes/parentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const menteeRoutes = require('./routes/menteeRoutes');
const cohortRoutes = require('./routes/cohortRoutes');
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');
const eventsRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Use routes
app.use('/api/parents', parentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentees', menteeRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});