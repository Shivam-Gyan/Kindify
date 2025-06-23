import mongoose from "mongoose";

const donorSchema = new mongoose.Schema({

    userObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    donations:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
    }],
    followedNgos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ngo",
    }],
    totalDonationAmount: {
        type: Number,
        required: true,
        default: 0
    },
    favouriteNgos:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ngo",
        }
    ]

});



const DonorModel = mongoose.model("Donor", donorSchema);
export default DonorModel;