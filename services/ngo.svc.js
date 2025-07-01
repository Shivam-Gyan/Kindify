import NgoModel from "../models/ngos.model.js";
import UserModel from '../models/user.model.js';
import userServices from "./user.svc.js";
import { getCountryCallingCode } from 'libphonenumber-js';

const NgoServices = {

    registerNgoService: async (data) => {
        try {
            const { name, role, email, registrationNumber, officialContactPhone, officialContactEmail } = data;
            if (!name || !email ||!role || !registrationNumber || !officialContactPhone || !officialContactEmail) {
                throw new Error("All fields are required for NGO registration");
            }
            if(!/^\d{10}$/.test(officialContactPhone)) {
                throw new Error("Official contact phone must be a 10-digit number");
            }

            // Create the NGO user
            const ngoUser = await userServices.getUserByEmail(email, role);
            // Create the NGO profile
            const ngoProfile = await NgoModel.create({
                userObjectId: ngoUser._id,
                name: name,
                registrationNumber,
                officialContactEmail,
                officialContactPhone,
                isEmailVerified: false, // Default to false, can be updated later
                isVerified: false, // Default to false, can be updated later
            });
            // await EmailUtlis.sendVerificationEmail(email, verificationToken);
            return ngoProfile;
        } catch (error) {
            
            throw new Error("Error in registerNgo service: " + error.message);
        }
    },
    // filtering ngos based on query parameters
    filterNgosServices: async (req) => {
        try {
            const { country, state, city, certified, category } = req.query;

            const filter = {};

            // 📍 Location filters
            if (country) filter['address.country'] = country;
            if (state) filter['address.state'] = state;
            if (city) filter['address.city'] = city;

            // ✅ Certified (true/false string to boolean)
            if (certified) {
                filter.isVerified = certified === 'true';
            }

            // 🏷️ Category (comma-separated string → array)
            if (category) {
                const categoryArray = category.split(',').map(cat => cat.trim().toLowerCase());
                filter.category = { $in: categoryArray };
            }

            // 🔎 Perform the query
            const ngos = await NgoModel.find(filter);

            return ngos
        } catch (error) {
            throw new Error(`Error filtering NGOs: ${error.message}`);
        }
    },

    // Fetching all NGOs
    getNgosServices: async () => {
        try {
            const ngos = await NgoModel.find();
            return ngos;
        } catch (error) {
            throw new Error(`Error retrieving NGOs: ${error.message}`);
        }
    },

    // Fetching NGO profile by userId
    getNgoProfileServices: async ({ userId }) => {
        try {

            const ngoUserProfile = await UserModel.findById(userId).select('name email isEmailVerified phone address');
            const ngo = await NgoModel.findOne({ userObjectId: userId });

            return { ngo, ngoUserProfile };
        } catch (error) {
            throw new Error(`Error retrieving NGO profile: ${error.message}`);
        }
    },

    addAccountDetailsService: async ({ email, role, bankName, accountHolderName, accountNumber, ifscCode, upiId, razorpayPaymentLink, preferredMethod }) => {
        try {
            if (!email || !role || !bankName || !accountHolderName || !accountNumber || !ifscCode || !upiId || !razorpayPaymentLink || !preferredMethod) {
                throw new Error("All fields are required to add account details");
            }

            const user = await userServices.getUserByEmail(email, role);

            // Prepare the account details as an array (since your schema expects an array)
            const accountDetails = [{
                bankName,
                accountHolderName,
                accountNumber,
                ifscCode,
                upiId,
                razorpayPaymentLink,
                preferredMethod
            }];

            // Update the NGO document's accountDetails field (replace with new array)
            const updatedNgoAccount = await NgoModel.findOneAndUpdate(
                { userObjectId: user._id },
                { $set: { accountDetails } },
                { new: true }
            );

            return updatedNgoAccount;
        } catch (error) {
            throw new Error(`Error adding account details: ${error.message}`);
        }
    }



}
export default NgoServices;

