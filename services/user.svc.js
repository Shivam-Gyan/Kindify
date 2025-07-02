import NgoModel from "../models/ngos.model.js";
import UserModel from "../models/user.model.js";
import EmailUtlis from "../utils/email.utils.js";

const userServices = {

    registerDonorService: async (data) => {
        try {
            const { name, email, password,nationality } = data;

            if (!name || !email || !password ||!nationality) {
                throw new Error("Something missing in register service of donor");
            }

            const donor = await UserModel.create({
                name: name,
                email: email,
                password: password,
                role: "donor",
                nationality:nationality
            });

            return donor;

        } catch (error) {
            // if there is an error in creating the donor, then delete the user with the same email
            // this is to avoid duplicate email error in the database
            await UserModel.deleteOne({ email: data.email });

            throw new Error("Error in registerDonor service: " + error.message);
        }
    },

    registerNgoService: async (data) => {
        try {
            const { name, email, password,nationality } = data;

            if (!name || !email || !password || !nationality) {
                throw new Error("Email and password are required");
            }

            const ngo = await UserModel.create({
                name: name,
                email: email,
                password: password,
                role: "ngo",
                nationality:nationality
            });

            return ngo;

        } catch (error) {
            // if there is an error in creating the NGO, then delete the user with the same email
            await UserModel.deleteOne({ email: data.email });

            throw new Error("Error in registerNgo service: " + error.message);
        }
    },

    // this fucntion return the user details by email id irrespective of role
    checkUserExistsWithEmail: async (email) => {
        try {
            if (!email) {
                throw new Error("oops! Email is required");
            }

            const donor = await UserModel.exists({ email: email });

            // if donor is not found, return false
            if (!donor) {
                return false;
            }
            // if donor is found, return true
            return true;

        } catch (error) {
            throw new Error("Error in getDonorbyEmail service: " + error.message);
        }
    },

    getUserByEmail: async (email, role) => {
        try {
            if (!email) {
                throw new Error("oops! Email is required");
            }

            const user = await UserModel.findOne({ email: email, role: role }).select('+password -__v');

            if (!user) {
                throw new Error("user not found with this email");
            }
            // if user is found, return user
            return user;

        } catch (error) {
            throw new Error(error.message);
        }
    },

    deleteUserByEmail: async ({ email }) => {
        await UserModel.deleteOne({
            email: email
        });
    },

    deletUserAccount: async (email, role) => {
        try {
            if (!email || !role) {
                throw new Error("Email and role are required");
            }

            // delete user from database
            const deletedUser = await UserModel.findOneAndDelete({ email: email, role: role });
            
            if (!deletedUser) {
                throw new Error("User not found");
            }

            if (role === "ngo") {
                // if user is ngo, then delete all the donations made by this ngo
                const deletedNGO = await NgoModel.deleteOne({
                    userObjectId: deletedUser._id
                })

                if (!deletedNGO) {
                    throw new Error("Error in deleting NGO details");
                }
            }


            // send email to user about account deletion
            await EmailUtlis.sendAccountDeletionEmail({ name: deletedUser.name, receiverEmail: deletedUser.email, subject: "You’ve Made a Difference. Thank You for Your Time with Kindify" });

            return true;

        } catch (error) {
            throw new Error("Error in deleteUserAccount service: " + error.message);
        }
    }
}

export default userServices;