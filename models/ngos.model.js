import mongoose from 'mongoose';


// Define the documents schema
const documentsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
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
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    total_donations: {
        type: String,
    },
    goal: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'planned'],
        default: 'planned'
    },
    images: [{
        type: String,
        trim: true
    }],
    videos: [{
        type: String,
        trim: true
    }],
    collaborators: [{
        type: String,
        trim: true
    }],
    likes: {
        type: String,
        default: "0"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

});

// Define the donors schema
const donorsSchema = new mongoose.Schema({
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // lifetime donation amount
    totalDonationAmount: {
        type: Number,
        required: true
    },
    // total number of donations made by the donor
    totalDonationsCount: {
        type: Number,
        default: 0
    },
    followedAt: {
        type: String,
        default: Date.now
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

const accountDetailsSchema = new mongoose.Schema(
    {
        upiId: { type: String, trim: true },
        razorpayPaymentLink: { type: String, trim: true },
        bankName: { type: String, trim: true },
        accountHolderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true },
        preferredMethod: { type: String, enum: ['upi', 'bank', 'razorpay'], default: 'upi' }
    }
)



const ngoSchema = new mongoose.Schema({
    userObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    officialContactPhone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v); // allows only 10-digit numeric Indian phone numbers
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },

    address: {
        street: String,
        city: String,
        state: String,
        district: String,
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
    documents: [documentsSchema],
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
    averageRatings: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    ratings: [{
        donorObjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 0,
            max: 5

        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // "donationCount" is the total number of donations received by the NGO.
    donationCount: { type: Number, default: 0 },
    // "searchCount" is the number of times the NGO has been searched for in the platform.
    searchCount: { type: Number, default: 0 },

    // donation schema
    donations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation'
    }],

    // Ngo account details ( bank account, UPI, etc. )
    accountDetails: [accountDetailsSchema],

}, { timestamps: true });

const NgoModel = mongoose.model('NGO', ngoSchema);

export default NgoModel;