import ContactAndQueryModel from '../models/contactAndQuery.model.js';

const ContactAndQuery = {

    generalQuery: async (req, res) => {
        try {
            const { phone, message, subject } = req.body;
            const type = req.params.type;
            const { role, email } = req.user;

            // Validate required fields
            if (!email || !subject || !message || !type) {
                return res.status(400).json({ error: "All fields are required." });
            }

            // Create a new contact and query entry
            const newQuery = await ContactAndQueryModel.create({
                phone: phone || "", // Optional field, can be empty
                email,
                role,
                type,
                message: message || "No message provided", // Default message if not provided
                subject: subject || "General Query", // Default subject if not provided
            });
            if (!newQuery) {
                throw new Error("Failed to create query");
            }

            // Respond with success message
            res.status(201).json({success:true, message: "Your query has been submitted successfully." });
        } catch (error) {
            console.error("Error submitting query:", error);
            res.status(500).json({success:false, message: "An error occurred while submitting your query." });
        }
    }


}

export default ContactAndQuery;