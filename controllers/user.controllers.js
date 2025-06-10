import userServices from "../services/user.svc.js";
import Validation from "../utils/validation.utlis.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import EmailUtlis from "../utils/email.utils.js";

const userController = {


    // function for usniversal user registration irrespective of role
    registerUser: async (req, res) => {

        try {

            // destructure the email, password and role from the request body
            let { name, email, password } = req.body;

            const role = req.params.role; // get the role from the request params

            // check if email, password and role are provided
            if (!name || !email || !password || !role) {
                throw new Error("all fields are required");
            }
            // check if role is valid
            const checkUserExistsWithEmail = await userServices.checkUserExistsWithEmail(email);

            // if user with email already exists, then return error
            if (checkUserExistsWithEmail) {
                throw new Error(`${role.charAt(0).toUpperCase() + role.slice(1)} with this email already exists`);
            }

            // validate the password using the passwordValidation function from validation utils
            const passwordValidation = Validation.passwordValidation(password);

            // if password is not valid, then return error
            if (!passwordValidation.valid) {
                throw new Error(`Password validation failed: ${passwordValidation.errors.join(", ")}`);
            }

            password = await bcrypt.genSalt(10)
                .then(salt => {
                    return bcrypt.hash(password, salt);
                }).catch(error => {
                    throw new Error("Error hashing password: " + error.message);
                });

            // declaring the donor variable here to use it globally in try block
            let donor = null;

            // if role is donor, then call the loginDonor service
            if (role === 'donor') {
                donor = await userServices.registerDonor({ name, email, password });
                if (!donor) {
                    throw new Error("Invalid email or password");
                }

                if (!donor.isEmailVerified && process.env.SMTP_LOCK === 'false') {

                    // generate OTP object {otp,otpExpiry} for the donor
                    const otpObject = EmailUtlis.generateOtp();

                    // set the otp and otpExpiry in the donor object
                    donor.otp = otpObject.otp;
                    donor.otpExpiry = otpObject.otpExpiry;

                    // save the donor object to the database
                    await donor.save();

                    const emailResponse = await EmailUtlis.otpMailForUser({
                        body: {
                            receiverEmail: email,
                            subject: 'Email Verification',
                            name: `${name}`,
                            otpType: 'register',
                            otp: otpObject.otp
                        }
                    }, res);

                    if (emailResponse && emailResponse.status !== 'success') {
                        throw new Error('Failed to send OTP email.');
                    }
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


        } catch (error) {
            // if there is an error in registration, then delete the user with the same email

            await userServices.deleteUserByEmail({ email: req.body.email });

            return res.status(500).json({ message: error.message });
        }

    },

    // function for universal user login irrespective of role
    LoginUser: async (req, res) => {
        try {
            const { email, password } = req.body;
            const role = req.params.role;

            if (!email || !password) {
                throw new Error("Email and password are required");
            }

            if (!['donor', 'ngo'].includes(role)) {
                throw new Error("Invalid role. Role must be either 'donor' or 'ngo'");
            }

            // Fetch user based on role
            const user = await userServices.getUserByEmail(email, role);

            if (!user) {
                throw new Error("User not found");
            }

            if (!user.isEmailVerified) {
                throw new Error("Email is not verified. Please verify your email before logging in.");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error("Invalid email or password");
            }

            const token = jwt.sign(
                {
                    email: user.email,
                    role: role,
                },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            // Send welcome email if SMTP is not locked
            if (process.env.SMTP_LOCK === 'false') {
                await EmailUtlis.welcomeMailForUser({
                    body: {
                        receiverEmail: user.email,
                        subject: 'Welcome to Kindify!',
                        name: user.name,
                        link: 'https://kindify.org' // replace with your actual link
                    }
                });
            }

            return res.status(200).json({
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully`,
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    role,
                    isEmailVerified: user.isEmailVerified,
                }
            });

        } catch (error) {
            return res.status(500).json({
                message: error.message,
                success: false
            });
        }
    }


}


export default userController;