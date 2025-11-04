const Mentee = require('../models/Mentees');
const Parents = require('../models/Parents');
const { logActivity } = require('./activityController');

// Create a new mentee
exports.createMentee = async (req, res) => {
    try {
        const { name, cohort, email, dob, schoolSystem, grade, phone, school, parents, procedure, doctorName, doctorEmail } = req.body;

        const newMentee = new Mentee({
            name,
            cohort,
            email,
            dob,
            schoolSystem,
            grade,
            phone,
            school,
            parents,
            procedure,
            doctorName,
            doctorEmail
        });

        await newMentee.save();
        
        // Log activity
        await logActivity(
            'mentee_created',
            `New mentee added: ${name}`,
            'Mentee',
            newMentee._id,
            name,
            req.user?.name // If you have user authentication
        );
        
        res.status(201).json(newMentee);
    } catch (error) {
        console.error('Error creating mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit an existing mentee
exports.editMentee = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const updates = req.body;

        const mentee = await Mentee.findByIdAndUpdate(menteeId, updates, { new: true });
        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }

        // Log activity
        await logActivity(
            'mentee_updated',
            `Mentee updated: ${mentee.name}`,
            'Mentee',
            mentee._id,
            mentee.name,
            req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(mentee);
    } catch (error) {
        console.error('Error editing mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all mentees
exports.getAllMentees = async (req, res) => {
    try {
        const mentees = await Mentee.find();
        res.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// delete a mentee
exports.deleteMentee = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const deletedMentee = await Mentee.findByIdAndDelete(menteeId);
        if (!deletedMentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }
        
        // Log activity
        await logActivity(
            'mentee_deleted',
            `Mentee deleted: ${deletedMentee.name}`,
            'Mentee',
            deletedMentee._id,
            deletedMentee.name,
            req.user?.name
        );
        
        res.json({ message: 'Mentee deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a single mentee by ID
exports.getMenteeById = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const mentee = await Mentee.findById(menteeId).populate('parents').populate('cohort');
        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }
        res.json(mentee);
    } catch (error) {
        console.error('Error fetching mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get total count of mentees
exports.getMenteeCount = async (req, res) => {
    try {
        const count = await Mentee.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching mentee count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add profile picture to mentee
exports.addMenteeProfilePic = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const profilePicUrl = req.body.profilepic;
        const mentee = await Mentee.findByIdAndUpdate(
            menteeId,
            { profilepic: profilePicUrl },
            { new: true }
        );
        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }
        res.json(mentee);
    } catch (error) {
        console.error('Error adding profile picture to mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
