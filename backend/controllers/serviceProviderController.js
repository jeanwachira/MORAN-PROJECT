const ServiceProvider = require('../models/ServiceProvider');

// Create a new Service Provider
exports.createServiceProvider = async (req, res) => {
    try {
        const { name, serviceType, contactEmail, phone } = req.body;

        const newServiceProvider = new ServiceProvider({
            name,
            serviceType,
            contactEmail,
            phone
        });

        await newServiceProvider.save();
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
        if (!serviceProvider) {
            return res.status(404).json({ error: 'Service Provider not found' });
        }

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
        const serviceProviderId = req.params.id;
        const serviceProvider = await ServiceProvider.findById(serviceProviderId);
        if (!serviceProvider) {
            return res.status(404).json({ error: 'Service Provider not found' });
        }
        res.json(serviceProvider);
    } catch (error) {
        console.error('Error fetching service provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a Service Provider
exports.deleteServiceProvider = async (req, res) => {
    try {
        const serviceProviderId = req.params.id;
        const deletedServiceProvider = await ServiceProvider.findByIdAndDelete(serviceProviderId);
        if (!deletedServiceProvider) {
            return res.status(404).json({ error: 'Service Provider not found' });
        }
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
