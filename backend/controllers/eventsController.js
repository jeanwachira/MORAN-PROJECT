const Events = require('../models/Events');
const { logActivity } = require('./activityController');

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { EventType, EventDate, ServiceProviders } = req.body;

        const newEvent = new Events({
            EventType,
            EventDate,
            ServiceProviders
        });

        await newEvent.save();
        
        // Log activity
        const formattedDate = new Date(EventDate).toLocaleDateString();
        await logActivity(
            'event_created',
            `New event scheduled: ${EventType} on ${formattedDate}`,
            'Event',
            newEvent._id,
            `${EventType} - ${formattedDate}`,
            req.user?.name
        );
        
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit an existing event
exports.editEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const updates = req.body;

        const event = await Events.findByIdAndUpdate(eventId, updates, { new: true });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Log activity
        const formattedDate = new Date(event.EventDate).toLocaleDateString();
        await logActivity(
            'event_updated',
            `Event updated: ${event.EventType} on ${formattedDate}`,
            'Event',
            event._id,
            `${event.EventType} - ${formattedDate}`,
            req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(event);
    } catch (error) {
        console.error('Error editing event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Events.find();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get an event by ID
exports.getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Events.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const deletedEvent = await Events.findByIdAndDelete(eventId);
        if (!deletedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Log activity
        const formattedDate = new Date(deletedEvent.EventDate).toLocaleDateString();
        await logActivity(
            'event_deleted',
            `Event deleted: ${deletedEvent.EventType} on ${formattedDate}`,
            'Event',
            deletedEvent._id,
            `${deletedEvent.EventType} - ${formattedDate}`,
            req.user?.name
        );
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get total count of events
exports.getEventCount = async (req, res) => {
    try {
        const count = await Events.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching event count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
