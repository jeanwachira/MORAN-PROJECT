const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/', paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/mentee/:menteeId', paymentController.getPaymentByMentee);
router.post('/:id/transactions', paymentController.addTransaction);
router.put('/:id/transactions/:txId/confirm', paymentController.confirmMpesa);

module.exports = router;