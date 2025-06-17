import DonorServices from '../services/donor.svc.js'

const DonorController={

    updateDonorPersonalInfo:async(req, res) => {

        try {
            const {email,role} = req.user; // Assuming user ID is stored in req.user
            const userDetails = req.body; // Get the updated details from the request body
            console.log("Updating donor personal details for email:", email, "with details:", userDetails);

            // Validate the input data if necessary
            if (!userDetails || Object.keys(userDetails).length === 0) {
                return res.status(400).json({ message: "No details provided to update." });
            }

            // Call the service to update donor personal details
            const updatedUser = await DonorServices.updateDonorPersonalDetails(email,role, userDetails);


            return res.status(200).json({
                message: "Donor personal details updated successfully.",
                success: true,
                data: {
                    email:updatedUser.email,
                    name: updatedUser.name, 
                    phone: updatedUser.phone,
                    address: updatedUser.address,
                    profilePicture: updatedUser.profilePicture,
                },
            });
        } catch (error) {
            return res.status(500).json({ message: `Error updating donor details: ${error.message}` });
        }
    },

}

export default DonorController;