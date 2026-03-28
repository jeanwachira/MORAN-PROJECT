const Parents = require('../models/Parents');
const { logActivity } = require('./activityController');

// Create a new parent
exports.createParent = async (req, res) => {
    try {
        const { parent, name, phone, email, profession, residence, mentee } = req.body;

        if (!profession || !residence) {
            return res.status(400).json({ error: 'Profession and residence are required' });
        }

        const newParent = new Parents({ parent, name, phone, email, profession, residence, mentee });
        await newParent.save();

        await logActivity(
            'parent_created',
            `New parent added: ${name} (${parent})`,
            'Parent', newParent._id, name, req.user?.name
        );

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
        if (!parent) return res.status(404).json({ error: 'Parent not found' });

        await logActivity(
            'parent_updated',
            `Parent updated: ${parent.name}`,
            'Parent', parent._id, parent.name, req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

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
        const parent = await Parents.findById(req.params.id);
        if (!parent) return res.status(404).json({ error: 'Parent not found' });
        res.json(parent);
    } catch (error) {
        console.error('Error fetching parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a parent
exports.deleteParent = async (req, res) => {
    try {
        const deletedParent = await Parents.findByIdAndDelete(req.params.id);
        if (!deletedParent) return res.status(404).json({ error: 'Parent not found' });

        await logActivity(
            'parent_deleted',
            `Parent deleted: ${deletedParent.name}`,
            'Parent', deletedParent._id, deletedParent.name, req.user?.name
        );

        res.json({ message: 'Parent deleted successfully' });
    } catch (error) {
        console.error('Error deleting parent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};