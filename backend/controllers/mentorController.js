const Mentor = require('../models/Mentor');

// Create a new mentor
exports.createMentor = async (req, res) => {
    try {
        const { name, profession, contactEmail, phone } = req.body;

        const newMentor = new Mentor({
            name,
            profession,
            contactEmail,
            phone
        });

        await newMentor.save();
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
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }

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
        const mentorId = req.params.id;
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }
        res.json(mentor);
    } catch (error) {
        console.error('Error fetching mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a mentor
exports.deleteMentor = async (req, res) => {
    try {
        const mentorId = req.params.id;
        const deletedMentor = await Mentor.findByIdAndDelete(mentorId);
        if (!deletedMentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }
        res.json({ message: 'Mentor deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add profile picture to mentor
exports.addMentorProfilePic = async (req, res) => {
    try {
        const mentorId = req.params.id;
        const profilePicUrl = req.body.profilepic;
        const mentor = await Mentor.findByIdAndUpdate(
            mentorId,
            { profilepic: profilePicUrl },
            { new: true }
        );
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' });
        }
        res.json(mentor);
    } catch (error) {
        console.error('Error adding profile picture to mentor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
