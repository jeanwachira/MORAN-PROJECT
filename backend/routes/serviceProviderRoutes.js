const express = require('express');
const router = express.Router();
const serviceProviderController = require('../controllers/serviceProviderController');

router.post('/', serviceProviderController.createServiceProvider);
router.put('/:id', serviceProviderController.editServiceProvider);
router.get('/', serviceProviderController.getAllServiceProviders);
router.get('/count', serviceProviderController.getServiceProviderCount);
router.get('/:id', serviceProviderController.getServiceProviderById);
router.delete('/:id', serviceProviderController.deleteServiceProvider);

module.exports = router;
