const Cohort = require('../models/Cohort');
const { logActivity } = require('./activityController');

// Create a new cohort
exports.createCohort = async (req, res) => {
    try {
        const { riika, year, residence, startDate, endDate } = req.body;

        const newCohort = new Cohort({
            riika,
            year,
            residence,
            startDate,
            endDate
        });

        await newCohort.save();
        
        // Log activity
        await logActivity(
            'cohort_created',
            `New cohort created: ${riika} ${year}`,
            'Cohort',
            newCohort._id,
            `${riika} ${year}`,
            req.user?.name
        );
        
        res.status(201).json(newCohort);
    } catch (error) {
        console.error('Error creating cohort:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit an existing cohort
exports.editCohort = async (req, res) => {
    try {
        const cohortId = req.params.id;
        const updates = req.body;

        const cohort = await Cohort.findByIdAndUpdate(cohortId, updates, { new: true });
        if (!cohort) {
            return res.status(404).json({ error: 'Cohort not found' });
        }

        // Log activity
        await logActivity(
            'cohort_updated',
            `Cohort updated: ${cohort.riika} ${cohort.year}`,
            'Cohort',
            cohort._id,
            `${cohort.riika} ${cohort.year}`,
            req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(cohort);
    } catch (error) {
        console.error('Error editing cohort:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all cohorts
exports.getAllCohorts = async (req, res) => {
    try {
        const cohorts = await Cohort.find();
        res.json(cohorts);
    } catch (error) {
        console.error('Error fetching cohorts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a cohort by ID
exports.getCohortById = async (req, res) => {
    try {
        const cohortId = req.params.id;
        const cohort = await Cohort.findById(cohortId);
        if (!cohort) {
            return res.status(404).json({ error: 'Cohort not found' });
        }
        res.json(cohort);
    } catch (error) {
        console.error('Error fetching cohort:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a cohort
exports.deleteCohort = async (req, res) => {
    try {
        const cohortId = req.params.id;
        const deletedCohort = await Cohort.findByIdAndDelete(cohortId);
        if (!deletedCohort) {
            return res.status(404).json({ error: 'Cohort not found' });
        }
        
        // Log activity
        await logActivity(
            'cohort_deleted',
            `Cohort deleted: ${deletedCohort.riika} ${deletedCohort.year}`,
            'Cohort',
            deletedCohort._id,
            `${deletedCohort.riika} ${deletedCohort.year}`,
            req.user?.name
        );
        
        res.json({ message: 'Cohort deleted successfully' });
    } catch (error) {
        console.error('Error deleting cohort:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//get cohort count
exports.getCohortCount = async (req, res) => {
    try {
        const count = await Cohort.countDocuments();
        res.json({ total: count });
    } catch (error) {
        console.error('Error fetching cohort count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
