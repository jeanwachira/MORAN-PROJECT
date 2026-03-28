const ServiceProvider = require('../models/ServiceProvider');
const { logActivity } = require('./activityController');

// Create a new Service Provider
exports.createServiceProvider = async (req, res) => {
    try {
        const { name, serviceType, contactEmail, phone } = req.body;

        const newServiceProvider = new ServiceProvider({ name, serviceType, contactEmail, phone });
        await newServiceProvider.save();

        await logActivity(
            'service_provider_created',
            `New service provider added: ${name} (${serviceType})`,
            'ServiceProvider', newServiceProvider._id, name, req.user?.name
        );

        res.status(201).json(newServiceProvider);
    } catch (error) {
        console.error('Error creating service provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit an existing Service Provider
exports.editServiceProvider = async (req, res) => {
    try {
        const serviceProviderId = req.params.id;
        const updates = req.body;

        const serviceProvider = await ServiceProvider.findByIdAndUpdate(serviceProviderId, updates, { new: true });
        if (!serviceProvider) return res.status(404).json({ error: 'Service Provider not found' });

        await logActivity(
            'service_provider_updated',
            `Service provider updated: ${serviceProvider.name}`,
            'ServiceProvider', serviceProvider._id, serviceProvider.name, req.user?.name,
            { updatedFields: Object.keys(updates) }
        );

        res.json(serviceProvider);
    } catch (error) {
        console.error('Error editing service provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all Service Providers
exports.getAllServiceProviders = async (req, res) => {
    try {
        const serviceProviders = await ServiceProvider.find();
        res.json(serviceProviders);
    } catch (error) {
        console.error('Error fetching service providers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get a Service Provider by ID
exports.getServiceProviderById = async (req, res) => {
    try {
        const serviceProvider = await ServiceProvider.findById(req.params.id);
        if (!serviceProvider) return res.status(404).json({ error: 'Service Provider not found' });
        res.json(serviceProvider);
    } catch (error) {
        console.error('Error fetching service provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a Service Provider
exports.deleteServiceProvider = async (req, res) => {
    try {
        const deletedServiceProvider = await ServiceProvider.findByIdAndDelete(req.params.id);
        if (!deletedServiceProvider) return res.status(404).json({ error: 'Service Provider not found' });

        await logActivity(
            'service_provider_deleted',
            `Service provider deleted: ${deletedServiceProvider.name}`,
            'ServiceProvider', deletedServiceProvider._id, deletedServiceProvider.name, req.user?.name
        );

        res.json({ message: 'Service Provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting service provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get total count of Service Providers
exports.getServiceProviderCount = async (req, res) => {
    try {
        const count = await ServiceProvider.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching service provider count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};