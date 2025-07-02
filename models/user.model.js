import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: true,
        select: false, // Exclude password from queries by default
    },
    phone: {
        countryCode: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\+\d{1,3}$/.test(v); // Validates country code format like +91, +1, etc.
                },
                message: props => `${props.value} is not a valid country code!`
            }
        },
        number: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v); // Validates phone number format like 1234567890
                },
                message: props => `${props.value} is not a valid phone number!`
            }
        },
        fullNumber: {
            type: String,
            trim: true,
            sparse: true  // allows multiple null/undefined values

        }
    },

    address: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 250,
    },
    role: {
        type: String,
        enum: ["donor", "ngo", "admin"],
    },
    profilePicture: {
        type: String,
        default: "https://tse4.mm.bing.net/th?id=OIP.fz29xDdt8iK_0EOsoMF5FwHaHa&pid=Api&P=0&h=180",
        trim: true,
    },
    otp: {
        type: String,
        trim: true,
    },
    otpExpiry: {
        type: Date,
        default: Date.now,
    },
    nationality: {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            trim: true,
        }
    }
}, { timestamps: true });

// Pre-save hook to set the full phone number
userSchema.pre("save", function (next) {
    if (this.phone.countryCode && this.phone.number) {
        this.phone.fullNumber = `${this.phone.countryCode}${this.phone.number}`;
    } else {
        this.phone.fullNumber = undefined; // or handle as needed
    }
    next();
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;