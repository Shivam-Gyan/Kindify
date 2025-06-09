import userServices from "../services/user.svc.js";
import Validation from "../utils/validation.utlis.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userController = {


    // function for usniversal user registration irrespective of role
    registerUser: async (req, res) => {

        try {

            // destructure the email, password and role from the request body
            let { name, email, password, role } = req.body;

            // check if email, password and role are provided
            if (!name || !email || !password || !role) {
                throw new Error("all fields are required");
            }
            // check if role is valid
            const checkUserExistsWithEmail = await userServices.checkUserExistsWithEmail(email);

            // if user with email already exists, then return error
            if (checkUserExistsWithEmail) {
                throw new Error("User with this email already exists");
            }

            // validate the password using the passwordValidation function from validation utils
            const passwordValidation = Validation.passwordValidation(password);

            // if password is not valid, then return error
            if (!passwordValidation.valid) {
                throw new Error(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
            }

            password = await bcrypt.genSalt(10).then(salt => {
                return bcrypt.hash(password, salt);
            });

            // declaring the donor variable here to use it globally in try block
            let donor = null;

            // if role is donor, then call the loginDonor service
            if (role === 'donor') {
                donor = await userServices.registerDonor({name, email, password });
                if (!donor) {
                    throw new Error("Invalid email or password");
                }
            }

            // declaring the ngo variable here to use it globally in try block
            let ngo = null;

            // if role is ngo, then handle NGO registration logic
            if (role === 'ngo') {
                // handle NGO registration logic here
                // for now, just return a success message
                return res.status(200).json({ message: "NGO registered successfully" });
            }

            const token = jwt.sign(
                {
                    email:email,
                    role: role
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            return res.status(200).json({ message: "registeration successful", registerData: donor || ngo, token });

        } catch (error) {
            console.error("Error in registerUser controller:", error.message);
            return res.status(500).json({ message: error.message });
        }

    },

    // function for universal user login irrespective of role
    LoginUser: async (req, res) => {

    },

}


export default userController;