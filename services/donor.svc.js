import UserModel from "../models/user.model.js";

const DonorServices={

    updateDonorPersonalDetails: async (email,role, userDetails) => {
        try {
            // Find the user by ID and update their personal details

            const updatedUser = await UserModel.findOneAndUpdate(
                {
                    email:email,
                    role:role
                },
                { $set: userDetails },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                console.error("User not found with email:", email, "and role:", role);
                throw new Error("User not found");
            }

            return updatedUser;
        } catch (error) {
            throw new Error(`Error updating donor details: ${error.message}`);
        }
    }

}


export default DonorServices;