const mongoose = require('mongoose');

const ParentsSchema = new mongoose.Schema({
    parent: { 
        type: String, 
        enum: ['Father', 'Mother'], 
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
                return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
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

// Index for faster queries - only add index for parent field
// email index is already created by unique: true
ParentsSchema.index({ parent: 1 });

module.exports = mongoose.model('Parents', ParentsSchema);