const Payment = require('../models/Payment');

const PROGRAM_AMOUNTS = {
    circumcision_and_mentorship: 150000,
    mentorship_only: 125000,
};

// ── Create payment record for a mentee ──────────────────────────────────────
exports.createPayment = async (req, res) => {
    try {
        const { menteeId, parentId, programType } = req.body;

        // Check if payment record already exists
        const existing = await Payment.findOne({ mentee: menteeId });
        if (existing) {
            return res.status(400).json({ error: 'Payment record already exists for this mentee' });
        }

        const totalAmount = PROGRAM_AMOUNTS[programType];
        if (!totalAmount) {
            return res.status(400).json({ error: 'Invalid program type' });
        }

        const payment = new Payment({
            mentee: menteeId,
            parent: parentId,
            programType,
            totalAmount,
            balance: totalAmount,
        });

        await payment.save();
        const populated = await Payment.findById(payment._id).populate('mentee', 'name admissionNumber').populate('parent', 'name phone');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// ── Add a transaction (M-Pesa or bank) ──────────────────────────────────────
exports.addTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, method, mpesaPhone, mpesaRef, bankSlipUrl, bankName, bankRef, notes } = req.body;

        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

        const transaction = {
            amount: parseFloat(amount),
            method,
            notes,
            recordedBy: req.user?.name || 'Admin',
            paidAt: new Date(),
        };

        if (method === 'mpesa') {
            transaction.mpesaPhone = mpesaPhone;
            transaction.mpesaRef = mpesaRef || null;
            // If no ref yet, mark pending (admin will confirm later)
            transaction.mpesaStatus = mpesaRef ? 'confirmed' : 'pending';
        } else if (method === 'bank') {
            transaction.bankSlipUrl = bankSlipUrl;
            transaction.bankName = bankName;
            transaction.bankRef = bankRef;
            transaction.mpesaStatus = 'confirmed'; // bank = auto-confirmed
        }

        payment.transactions.push(transaction);
        await payment.save(); // pre-save hook updates totals

        const populated = await Payment.findById(id).populate('mentee', 'name admissionNumber').populate('parent', 'name phone');
        res.json(populated);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Confirm a pending M-Pesa transaction ────────────────────────────────────
exports.confirmMpesa = async (req, res) => {
    try {
        const { id, txId } = req.params;
        const { mpesaRef } = req.body;

        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        const tx = payment.transactions.id(txId);
        if (!tx) return res.status(404).json({ error: 'Transaction not found' });

        tx.mpesaStatus = 'confirmed';
        if (mpesaRef) tx.mpesaRef = mpesaRef;
        await payment.save();

        const populated = await Payment.findById(id).populate('mentee', 'name admissionNumber').populate('parent', 'name phone');
        res.json(populated);
    } catch (error) {
        console.error('Error confirming M-Pesa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Get all payments (admin overview) ───────────────────────────────────────
exports.getAllPayments = async (req, res) => {
    try {
        const { status, programType } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (programType) filter.programType = programType;

        const payments = await Payment.find(filter)
            .populate('mentee', 'name admissionNumber schoolSystem grade')
            .populate('parent', 'name phone email parent')
            .sort({ updatedAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Get payment by mentee ID ─────────────────────────────────────────────────
exports.getPaymentByMentee = async (req, res) => {
    try {
        const payment = await Payment.findOne({ mentee: req.params.menteeId })
            .populate('mentee', 'name admissionNumber')
            .populate('parent', 'name phone email parent');
        if (!payment) return res.status(404).json({ error: 'No payment record found for this mentee' });
        res.json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Get payment summary stats ────────────────────────────────────────────────
exports.getPaymentSummary = async (req, res) => {
    try {
        const all = await Payment.find();
        const totalExpected = all.reduce((s, p) => s + p.totalAmount, 0);
        const totalCollected = all.reduce((s, p) => s + p.amountPaid, 0);
        const totalBalance = all.reduce((s, p) => s + p.balance, 0);
        const byStatus = { paid: 0, partial: 0, unpaid: 0 };
        all.forEach(p => byStatus[p.status]++);

        res.json({
            totalRecords: all.length,
            totalExpected,
            totalCollected,
            totalBalance,
            collectionRate: all.length ? Math.round((totalCollected / totalExpected) * 100) : 0,
            byStatus,
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};