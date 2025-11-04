const Activity = require('../models/Activity');

// Get recent activities with pagination
exports.getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Activity.countDocuments();

        res.json({
            activities,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get activities by entity type
exports.getActivitiesByEntity = async (req, res) => {
    try {
        const { entityType } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ entityType })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Activity.countDocuments({ entityType });

        res.json({
            activities,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching activities by entity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get activities for a specific entity
exports.getActivitiesForEntity = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find({ 
            entityType, 
            entityId 
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Activity.countDocuments({ entityType, entityId });

        res.json({
            activities,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching activities for entity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete old activities (cleanup)
exports.deleteOldActivities = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90; // Default: delete activities older than 90 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await Activity.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.json({
            message: `Deleted ${result.deletedCount} activities older than ${days} days`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting old activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Log activity function (used by other controllers)
exports.logActivity = async (type, description, entityType, entityId, entityName, userName, metadata = {}) => {
    try {
        const activity = new Activity({
            type,
            description,
            entityType,
            entityId,
            entityName,
            user: userName || 'System',
            metadata
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error here to avoid breaking the main operation
    }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await Activity.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$entityType',
                    count: { $sum: 1 },
                    lastActivity: { $max: '$createdAt' }
                }
            },
            {
                $project: {
                    entityType: '$_id',
                    count: 1,
                    lastActivity: 1,
                    _id: 0
                }
            }
        ]);

        const totalActivities = await Activity.countDocuments();
        const recentActivities = await Activity.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            totalActivities,
            recentActivities,
            statsByEntity: stats,
            period: '30 days'
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Search activities
exports.searchActivities = async (req, res) => {
    try {
        const { q, type, entityType, startDate, endDate } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        let filter = {};

        // Text search
        if (q) {
            filter.$or = [
                { description: { $regex: q, $options: 'i' } },
                { entityName: { $regex: q, $options: 'i' } },
                { user: { $regex: q, $options: 'i' } }
            ];
        }

        // Filter by activity type
        if (type) {
            filter.type = type;
        }

        // Filter by entity type
        if (entityType) {
            filter.entityType = entityType;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Activity.countDocuments(filter);

        res.json({
            activities,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            filters: {
                query: q,
                type,
                entityType,
                startDate,
                endDate
            }
        });
    } catch (error) {
        console.error('Error searching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};