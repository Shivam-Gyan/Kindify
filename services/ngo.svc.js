import NgoModel from "../models/ngos.model.js";
import UserModel from '../models/user.model.js';
import userServices from "./user.svc.js";
import { getCountryCallingCode } from 'libphonenumber-js';

const NgoServices = {

    registerNgoService: async (data) => {
        try {
            const { name, role, email, registrationNumber, officialContactPhone, officialContactEmail } = data;
            if (!name || !email || !role || !registrationNumber || !officialContactPhone || !officialContactEmail) {
                throw new Error("All fields are required for NGO registration");
            }
            if (!/^\d{10}$/.test(officialContactPhone)) {
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
                address: {
                    street: "",
                    city: "",
                    state: "",
                    postalCode: "",
                    country: ngoUser.nationality?.name
                },
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
            if (country) filter['address.country'] = country.toLowerCase();
            if (state) filter['address.state'] = state.toLowerCase();
            if (city) filter['address.city'] = city.toLowerCase();

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
    },

    addAddressAndLogoService: async ({ officialContactEmail, address, logo }) => {
        try {
            if (!logo || !address || !officialContactEmail) {
                throw new Error("User ID and address are required");
            }

            // Update the NGO's address and logo
            const updatedNgo = await NgoModel.findOneAndUpdate(
                { officialContactEmail: officialContactEmail },
                { $set: { address, logo } },
                { new: true }
            );

            await UserModel.findOneAndUpdate(
                { email: officialContactEmail },
                { $set: { address: address, logo: logo } },
                { new: true }
            );

            if (!updatedNgo) {
                throw new Error("NGO not found or update failed");
            }

            return updatedNgo;
        } catch (error) {
            throw new Error(`Error updating NGO address and logo: ${error.message}`);
        }
    },

    getNgoProfileByEmail: async ({ userObjectId }) => {
        try {
            if (!userObjectId) {
                throw new Error("User ID is required to fetch NGO profile");
            }

            const ngoProfile = await NgoModel.findOne({ userObjectId: userObjectId });

            if (!ngoProfile) {
                throw new Error("NGO profile not found");
            }

            return ngoProfile;
        } catch (error) {
            throw new Error(`${error.message}`);
        }
    },
    // this is for donor to see ngo details
    getNgoDetailsServices: async ({ userId }) => {
        try {
            if (!userId) {
                throw new Error("User ID is required to fetch NGO details");
            }
            console.log("Fetching NGO details for user ID:", userId);
            const ngoDetails = await NgoModel.findOne({ userObjectId: userId }).select('-accountDetails -__v').populate('userObjectId', 'name email phone ');
            console.log(ngoDetails);
            if (!ngoDetails) {
                throw new Error("NGO details not found");
            }

            return ngoDetails;
        } catch (error) {
            throw new Error(`Error fetching NGO details: ${error.message}`);
        }
    },
    followNgoService: async ({ email, ngoId, like, follow }) => {
        console.log("Follow/Like NGO service called with:", { email, ngoId, like, follow });

        try {
            if (!email || !ngoId) {
                throw new Error("User email and NGO ID are required");
            }

            const user = await UserModel.findOne({ email });
            if (!user) throw new Error("User not found");
            if (user.role !== 'donor') throw new Error("Only donors can perform this action");

            const ngo = await NgoModel.findById(ngoId);
            if (!ngo) throw new Error("NGO not found");

            let updated = false;

            // FOLLOW / UNFOLLOW
            const isFollowing = user.followingNgos.includes(ngoId);
            if (follow && !isFollowing) {
                user.followingNgos.push(ngoId);

                // Add to donors if not already added
                const alreadyDonor = ngo.donors.some(d => d.donorId.toString() === user._id.toString());
                if (!alreadyDonor) {
                    ngo.donors.push({
                        donorId: user._id,
                        totalDonationAmount: 0,
                        totalDonationsCount: 0
                    });
                }

                updated = true;

            } else if (!follow && isFollowing) {
                // Unfollow logic
                user.followingNgos = user.followingNgos.filter(id => id.toString() !== ngoId.toString());

                // Remove donor if zero donation and not liked
                const donorIndex = ngo.donors.findIndex(d => d.donorId.toString() === user._id.toString());
                if (donorIndex !== -1) {
                    const donor = ngo.donors[donorIndex];
                    const hasDonated = donor.totalDonationAmount > 0 || donor.totalDonationsCount > 0;
                    const stillLikes = user.favoriteNgos.includes(ngoId);

                    if (!hasDonated && !stillLikes) {
                        ngo.donors.splice(donorIndex, 1);
                    }
                }

                updated = true;
            }

            // LIKE / UNLIKE
            const isLiked = user.favoriteNgos.includes(ngoId);
            if (like && !isLiked) {
                user.favoriteNgos.push(ngoId);
                updated = true;
            } else if (!like && isLiked) {
                user.favoriteNgos = user.favoriteNgos.filter(id => id.toString() !== ngoId.toString());

                // Optional: Remove from donors if also not followed and never donated
                const donorIndex = ngo.donors.findIndex(d => d.donorId.toString() === user._id.toString());
                const isStillFollowing = user.followingNgos.includes(ngoId);
                if (donorIndex !== -1) {
                    const donor = ngo.donors[donorIndex];
                    const hasDonated = donor.totalDonationAmount > 0 || donor.totalDonationsCount > 0;

                    if (!hasDonated && !isStillFollowing) {
                        ngo.donors.splice(donorIndex, 1);
                    }
                }

                updated = true;
            }

            if (updated) {
                await user.save();
                await ngo.save();
            }

            return user;

        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

}
export default NgoServices;

