const cors = require('cors');
const express = require('express');
const passport = require('passport');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize Express app FIRST
const app = express();

// Then apply middleware to the app
app.use(cors());
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());
require('./config/passport');

// Connect to database
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});