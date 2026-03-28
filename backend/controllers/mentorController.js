const Mentor = require('../models/Mentor');
const { logActivity } = require('./activityController');

// Create a new mentor
exports.createMentor = async (req, res) => {
    try {
        const { name, profession, contactEmail, phone } = req.body;

        const newMentor = new Mentor({ name, profession, contactEmail, phone });
        await newMentor.save();

        await logActivity(
            'mentor_created',
            `New mentor added: ${name} (${profession})`,
            'Mentor', newMentor._id, name, req.user?.name
        );

        res.status(201).json(newMentor);
    } catch (error) {
        console.error('Error creating mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit an existing mentor
exports.editMentor = async (req, res) => {
    try {
        const mentorId = req.params.id;
        const updates = req.body;

        const mentor = await Mentor.findByIdAndUpdate(mentorId, updates, { new: true });
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

        await logActivity(
            'mentor_updated',
            `Mentor updated: ${mentor.name}`,
            'Mentor', mentor._id, mentor.name, req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(mentor);
    } catch (error) {
        console.error('Error editing mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all mentors
exports.getAllMentors = async (req, res) => {
    try {
        const mentors = await Mentor.find();
        res.json(mentors);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a mentor by ID
exports.getMentorById = async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
        res.json(mentor);
    } catch (error) {
        console.error('Error fetching mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a mentor
exports.deleteMentor = async (req, res) => {
    try {
        const deletedMentor = await Mentor.findByIdAndDelete(req.params.id);
        if (!deletedMentor) return res.status(404).json({ error: 'Mentor not found' });

        await logActivity(
            'mentor_deleted',
            `Mentor deleted: ${deletedMentor.name}`,
            'Mentor', deletedMentor._id, deletedMentor.name, req.user?.name
        );

        res.json({ message: 'Mentor deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add profile picture to mentor
exports.addMentorProfilePic = async (req, res) => {
    try {
        const mentor = await Mentor.findByIdAndUpdate(
            req.params.id,
            { profilepic: req.body.profilepic },
            { new: true }
        );
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
        res.json(mentor);
    } catch (error) {
        console.error('Error adding profile picture to mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get total count of mentors
exports.getMentorCount = async (req, res) => {
    try {
        const count = await Mentor.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching mentor count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};