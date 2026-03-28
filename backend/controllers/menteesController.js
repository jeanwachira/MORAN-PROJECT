const Mentee = require('../models/Mentees');
const Parents = require('../models/Parents');
const Payment = require('../models/Payment');
const Cohort = require('../models/Cohort');

const BILLING_CUTOFF = new Date('2026-07-01');
const PROGRAM_AMOUNTS = { circumcision_and_mentorship: 150000, mentorship_only: 125000 };
const { logActivity } = require('./activityController');

const syncParentMenteeArrays = async (menteeId, newParentIds = [], removedParentIds = []) => {
    const ops = [];

    if (newParentIds.length) {
        ops.push(
            Parents.updateMany(
                { _id: { $in: newParentIds } },
                { $addToSet: { mentee: menteeId } }
            )
        );
    }

    if (removedParentIds.length) {
        ops.push(
            Parents.updateMany(
                { _id: { $in: removedParentIds } },
                { $pull: { mentee: menteeId } }
            )
        );
    }

    await Promise.all(ops);
};

// ─── Create a new mentee ──────────────────────────────────────────────────────
exports.createMentee = async (req, res) => {
    try {
        const {
            admissionNumber,
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
        } = req.body;

        // Check if admission number already exists (if provided)
        if (admissionNumber) {
            const existing = await Mentee.findOne({
                admissionNumber: admissionNumber.toUpperCase()
            });
            if (existing) {
                return res.status(400).json({ error: 'Admission number already exists' });
            }
        }

        const parentIds = Array.isArray(parents) ? parents : (parents ? [parents] : []);

        const { programType, skipBilling } = req.body;

        const newMentee = new Mentee({
            admissionNumber: admissionNumber?.toUpperCase(),
            name, cohort, email, dob, schoolSystem, grade,
            phone, school, parents: parentIds,
            procedure, doctorName, doctorEmail,
            programType: programType || 'mentorship_only',
        });

        await newMentee.save();

        // Sync: add this mentee to each selected parent's mentee array
        await syncParentMenteeArrays(newMentee._id, parentIds, []);

        // Auto-create payment record if cohort starts >= July 2026 and not a historical import
        if (!skipBilling && programType) {
            try {
                const cohortDoc = await Cohort.findById(cohort);
                const shouldAutoBill = cohortDoc && new Date(cohortDoc.startDate) >= BILLING_CUTOFF;
                if (shouldAutoBill) {
                    const totalAmount = PROGRAM_AMOUNTS[programType];
                    if (totalAmount && parentIds.length > 0) {
                        await Payment.create({
                            mentee: newMentee._id,
                            parent: parentIds[0],
                            programType,
                            totalAmount,
                            balance: totalAmount,
                        });
                    }
                }
            } catch (payErr) {
                // Don't fail the mentee creation if payment creation fails
                console.error('Auto-payment creation failed:', payErr.message);
            }
        }

        await logActivity(
            'mentee_created',
            `New mentee added: ${name} (${newMentee.admissionNumber})`,
            'Mentee', newMentee._id, name, req.user?.name
        );

        res.status(201).json(newMentee);
    } catch (error) {
        console.error('Error creating mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Edit an existing mentee ──────────────────────────────────────────────────
exports.editMentee = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const updates = req.body;

        // Fetch the current mentee so we can diff the parents arrays
        const before = await Mentee.findById(menteeId);
        if (!before) {
            return res.status(404).json({ error: 'Mentee not found' });
        }

        const oldParentIds = before.parents.map(id => id.toString());
        const newParentIds = updates.parents
            ? (Array.isArray(updates.parents) ? updates.parents : [updates.parents]).map(id => id.toString())
            : oldParentIds;

        const added   = newParentIds.filter(id => !oldParentIds.includes(id));
        const removed = oldParentIds.filter(id => !newParentIds.includes(id));

        const mentee = await Mentee.findByIdAndUpdate(menteeId, updates, { new: true });

        // Sync parent arrays for added/removed parents only
        await syncParentMenteeArrays(menteeId, added, removed);

        await logActivity(
            'mentee_updated',
            `Mentee updated: ${mentee.name}`,
            'Mentee', mentee._id, mentee.name, req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(mentee);
    } catch (error) {
        console.error('Error editing mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Delete a mentee ──────────────────────────────────────────────────────────
exports.deleteMentee = async (req, res) => {
    try {
        const menteeId = req.params.id;
        const deletedMentee = await Mentee.findByIdAndDelete(menteeId);
        if (!deletedMentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }

        // Sync: remove this mentee from ALL parents that referenced it
        await syncParentMenteeArrays(menteeId, [], deletedMentee.parents.map(id => id.toString()));

        await logActivity(
            'mentee_deleted',
            `Mentee deleted: ${deletedMentee.name}`,
            'Mentee', deletedMentee._id, deletedMentee.name, req.user?.name
        );

        res.json({ message: 'Mentee deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get all mentees ──────────────────────────────────────────────────────────
exports.getAllMentees = async (req, res) => {
    try {
        const mentees = await Mentee.find();
        res.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get a single mentee by ID ────────────────────────────────────────────────
exports.getMenteeById = async (req, res) => {
    try {
        const mentee = await Mentee.findById(req.params.id)
            .populate('parents')
            .populate('cohort');
        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }
        res.json(mentee);
    } catch (error) {
        console.error('Error fetching mentee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get total count of mentees ───────────────────────────────────────────────
exports.getMenteeCount = async (req, res) => {
    try {
        const count = await Mentee.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching mentee count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Add profile picture ──────────────────────────────────────────────────────
exports.addMenteeProfilePic = async (req, res) => {
    try {
        const mentee = await Mentee.findByIdAndUpdate(
            req.params.id,
            { profilepic: req.body.profilepic },
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

// ─── Search by admission number ───────────────────────────────────────────────
exports.searchByAdmissionNumber = async (req, res) => {
    try {
        const mentee = await Mentee.findOne({
            admissionNumber: req.params.admissionNumber.toUpperCase()
        })
            .populate('parents')
            .populate('cohort');

        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found with this admission number' });
        }
        res.json(mentee);
    } catch (error) {
        console.error('Error searching mentee by admission number:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Get complete profile including activities ────────────────────────────────
exports.getMenteeCompleteProfile = async (req, res) => {
    try {
        const mentee = await Mentee.findOne({
            admissionNumber: req.params.admissionNumber.toUpperCase()
        })
            .populate('parents')
            .populate('cohort');

        if (!mentee) {
            return res.status(404).json({ error: 'Mentee not found' });
        }

        const Activity = require('../models/Activity');
        const activities = await Activity.find({
            entityType: 'Mentee',
            entityId: mentee._id
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ mentee, activities, totalActivities: activities.length });
    } catch (error) {
        console.error('Error fetching complete mentee profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};