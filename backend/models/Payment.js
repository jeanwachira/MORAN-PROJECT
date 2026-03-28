const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    mentee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentee',
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parents',
        required: true,
    },
    programType: {
        type: String,
        enum: ['circumcision_and_mentorship', 'mentorship_only'],
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        // 150000 for circumcision_and_mentorship, 125000 for mentorship_only
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: function() { return this.totalAmount; }
    },
    status: {
        type: String,
        enum: ['unpaid', 'partial', 'paid'],
        default: 'unpaid',
    },
    transactions: [
        {
            amount: { type: Number, required: true },
            method: { type: String, enum: ['mpesa', 'bank'], required: true },
            // M-Pesa fields
            mpesaPhone: { type: String },
            mpesaRef: { type: String },       // M-Pesa confirmation code
            mpesaStatus: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
            // Bank fields
            bankSlipUrl: { type: String },     // Cloudinary URL
            bankName: { type: String },
            bankRef: { type: String },         // Bank transaction reference
            // Common
            notes: { type: String },
            recordedBy: { type: String },
            paidAt: { type: Date, default: Date.now },
        }
    ],
}, { timestamps: true });

// Auto-update amountPaid, balance, status before save
PaymentSchema.pre('save', function(next) {
    const confirmed = this.transactions
        .filter(t => t.method === 'bank' || t.mpesaStatus === 'confirmed')
        .reduce((sum, t) => sum + t.amount, 0);
    this.amountPaid = confirmed;
    this.balance = Math.max(0, this.totalAmount - confirmed);
    if (confirmed >= this.totalAmount) this.status = 'paid';
    else if (confirmed > 0) this.status = 'partial';
    else this.status = 'unpaid';
    next();
});

module.exports = mongoose.model('Payment', PaymentSchema);