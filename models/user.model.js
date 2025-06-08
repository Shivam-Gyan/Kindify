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
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 10,
        maxlength: 15,
    },
    address: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 200,
    },
    role: {
        type: String,
        enum: ["donor","ngo","admin"],
    },

    // if role is NGO, then this field will be used for find the person designsation in NGO who is resgistering.
    // only for NGO role not for donor or admin
    designation: {
        type: String,
        trim: true,
        enum: ["Manager", "Volunteer", "Coordinator", "Other"],
        default: "Other",
    },  

},{timestamps: true});


const UserModel = mongoose.model("User", userSchema);

export default UserModel;