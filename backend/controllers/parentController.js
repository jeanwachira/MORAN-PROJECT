const Parents = require('../models/Parents');

// Create a new parent
exports.createParent = async (req, res) => {
    try {
        const { parent, name, phone, email, profession, residence, mentee } = req.body;

        // Add validation
        if (!profession || !residence) {
            return res.status(400).json({ error: 'Profession and residence are required' });
        }

        const newParent = new Parents({
            parent,
            name,
            phone,
            email,
            profession,  // Added
            residence,   // Added
            mentee
        });

        await newParent.save();
        res.status(201).json(newParent);
    } catch (error) {
        console.error('Error creating parent:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// Edit an existing parent
exports.editParent = async (req, res) => {
    try {
        const parentId = req.params.id;
        const updates = req.body;

        const parent = await Parents.findByIdAndUpdate(parentId, updates, { new: true });
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        res.json(parent);
    } catch (error) {
        console.error('Error editing parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all parents
exports.getAllParents = async (req, res) => {
    try {
        const parents = await Parents.find();
        res.json(parents);
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a parent by ID
exports.getParentById = async (req, res) => {
    try {
        const parentId = req.params.id;
        const parent = await Parents.findById(parentId);
        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }
        res.json(parent);
    } catch (error) {
        console.error('Error fetching parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a parent
exports.deleteParent = async (req, res) => {
    try {
        const parentId = req.params.id;
        const deletedParent = await Parents.findByIdAndDelete(parentId);
        if (!deletedParent) {
            return res.status(404).json({ error: 'Parent not found' });
        }
        res.json({ message: 'Parent deleted successfully' });
    } catch (error) {
        console.error('Error deleting parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
