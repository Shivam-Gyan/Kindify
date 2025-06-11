import mongoose from 'mongoose';


// Define the documents schema
const documentsSchema = new mongoose.Schema({
    documentType: {
        type: String,
        required: true,
        enum: ['registration_certificate', 'tax_exemption', 'annual_report', 'other'],
        default: 'other'
    },
    documentUrl: {
        type: String,
        required: true,
        trim: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Define the project schema
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    budget: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'planned'],
        default: 'planned'
    },
    images:[{
        type: String,
        trim: true
    }],
    videos:[{
        type: String,
        trim: true
    }],
    collaborators: [{
        type:String,
        trim: true
    }],
});

// Define the donors schema
const donorsSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    donationAmount: {
        type: Number,
        required: true
    },
    donationDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'upi', 'bank_transfer'],
        default: 'upi'
    }
});

// Define the event schema
const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    participantsCount: {
        type: Number,
        default: 0
    }
});



const ngoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true
    },
    officialContactEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    officialContactPhone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    website: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    establishedYear: {
        type: Number
    },
    // "category" represents the areas or fields in which the NGO operates, 
    // such as "health", "education", "environment", etc.
    category: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    documents:[documentsSchema],
    logo: {
        type: String,
        trim: true
    },
    socialMediaLinks: {
        facebook: {
            type: String,
            trim: true
        },
        twitter: {
            type: String,
            trim: true
        },
        instagram: {
            type: String,
            trim: true
        },
        linkedin: {
            type: String,
            trim: true
        }
    },
    // "projects" is an array of objects representing the projects the NGO is involved in.
    projects: [projectSchema],

    // "donors" is an array of objects representing the donors associated with the NGO.
    donors: [donorsSchema],
    
    // "events" is an array of objects representing the events organized by the NGO.
    events: [eventSchema],

    
},{timestamps: true});

const NgoModel = mongoose.model('NGO', ngoSchema);

export default NgoModel;