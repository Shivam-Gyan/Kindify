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
        // required: true,
        unique: true,
        trim: true,
        minlength: 10,
        maxlength: 15,
    },
    address: {
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 250,
    },
    role: {
        type: String,
        enum: ["donor","ngo","admin"],
    },
    profilePicture:{
        type: String,
        default: "https://tse4.mm.bing.net/th?id=OIP.fz29xDdt8iK_0EOsoMF5FwHaHa&pid=Api&P=0&h=180",
        trim: true,
    },

    // if role is NGO, then this field will be used for find the person designsation in NGO who is resgistering.
    // only for NGO role not for donor or admin
    designation: {
        type: String,
        trim: true,
        enum: ["Manager", "Volunteer", "Coordinator", "Other"],
        default: "Other",
    },  
    otp: {
        type: String,
        trim: true,
    },
    otpExpiry:{
        type: Date,
        default: Date.now,
    },
    followedNgos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ngo",
    }],
    

},{timestamps: true});


const UserModel = mongoose.model("User", userSchema);

export default UserModel;