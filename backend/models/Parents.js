const mongoose = require('mongoose');

const ParentsSchema = new mongoose.Schema({
    parent: { 
        type: String, 
        enum: ['Father', 'Mother', 'Guardian'], 
        required: [true, 'Parent type is required']
    },
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^(\+?254|0)[17]\d{8}$/.test(v.replace(/[\s\-().]/g, ''));
            },
            message: props => `${props.value} is not a valid Kenyan phone number! Use 07XX XXX XXX or +2547XX XXX XXX`
        }
    },
    profession: { 
        type: String, 
        required: [true, 'Profession is required'],
        trim: true
    },
    residence: { 
        type: String, 
        required: [true, 'Residence is required'],
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    mentee: { 
        type: [mongoose.Schema.Types.ObjectId], 
        ref: 'Mentee', 
        required: [true, 'At least one mentee is required'],
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'At least one mentee must be assigned'
        }
    },
}, {
    timestamps: true
});

ParentsSchema.index({ parent: 1 });

module.exports = mongoose.model('Parents', ParentsSchema);