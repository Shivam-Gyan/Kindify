import userServices from "../services/user.svc.js";
import Validation from "../utils/validation.utlis.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import EmailUtlis from "../utils/email.utils.js";
import { getCountryCallingCode } from 'libphonenumber-js';
import NgoServices from "../services/ngo.svc.js";

const userController = {


    // function for usniversal user registration irrespective of role
    registerUser: async (req, res) => {
        try {
            // destructure the email, password and role from the request body
            let { name, email, nationality, password } = req.body;

            console.log("Registering user with data:", req.body);

            const role = req.params.role; // get the role from the request params

            // check if email, password and role are provided
            if (!name || !email || !password || !nationality || !role) {
                return res.status(400).json({ message: "Name, email, password is required", success: false });
            }
            // check if role is valid
            const checkUserExistsWithEmail = await userServices.checkUserExistsWithEmail(email);

            // if user with email already exists, then return error
            if (checkUserExistsWithEmail) {
                return res.status(400).json({ message: "User with this email already exists", success: false });
            }

            // validate the password using the passwordValidation function from validation utils
            const passwordValidation = Validation.passwordValidation(password);

            // if password is not valid, then return error
            if (!passwordValidation.valid) {
                return res.status(400).json({ message: passwordValidation.message, success: false });
            }

            password = await bcrypt.genSalt(10)
                .then(salt => {
                    return bcrypt.hash(password, salt);
                }).catch(error => {
                    return res.status(500).json({ message: "Error hashing password", success: false });
                });

            // declaring the donor variable here to use it globally in try block
            let donor = null;
            let ngo = null;

            // <----------------------------------------------------------------->
            // if role is donor, then call the loginDonor service
            if (role === 'donor') {
                donor = await userServices.registerDonorService({ name, email, password, nationality });
                if (!donor) {
                    throw new Error("Invalid email or password");
                }

                // Generate OTP for email verification
                const otpObject = EmailUtlis.generateOtp();
                donor.otp = otpObject.otp;
                donor.otpExpiry = otpObject.otpExpiry;
                await donor.save();

                // Send OTP email
                try {
                    await EmailUtlis.otpMailForUser({
                        body: {
                            receiverEmail: email,
                            subject: 'Email Verification',
                            name: name,
                            otpType: 'registration',
                            otp: otpObject.otp
                        }
                    }, res);
                } catch (emailError) {
                    console.error('Error sending OTP email:', emailError);
                    // Don't throw error, just log it
                }

                return res.status(200).json({
                    message: "Donor registered successfully. Please verify your email.",
                    success: true,
                    user: {
                        name: donor.name,
                        email: email,
                        role: role,
                        isEmailVerified: false
                    }
                });
            }

            //<----------------------------------------------------------------->
            // if role is ngo, then handle NGO registration logic
            if (role === 'ngo') {
                ngo = await userServices.registerNgoService({ name, email, password, nationality });
                if (!ngo) {
                    throw new Error("Invalid email or password");
                }

                // Generate OTP for email verification
                const otpObject = EmailUtlis.generateOtp();
                ngo.otp = otpObject.otp;
                ngo.otpExpiry = otpObject.otpExpiry;
                await ngo.save();

                // Send OTP email
                try {
                    await EmailUtlis.otpMailForUser({
                        body: {
                            receiverEmail: email,
                            subject: 'Email Verification',
                            name: name,
                            otpType: 'registration',
                            otp: otpObject.otp
                        }
                    }, res);
                } catch (emailError) {
                    console.error('Error sending OTP email:', emailError);
                    // Don't throw error, just log it
                }

                return res.status(200).json({
                    message: "NGO registered successfully. Please verify your email.",
                    success: true,
                    user: {
                        name: ngo.name,
                        email: email,
                        role: role,
                        isEmailVerified: false
                    }
                });
            }

            return res.status(201).json({
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
                success: true,
                user: {
                    name: donor ? donor.name : ngo.name,
                    email: email,
                    role: role,
                    isEmailVerified: false
                }
            });

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

            console.log({ email, role, password })
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
                success: true,
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
    },



    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const role = req.params.role;

            if (!email) {
                throw new Error("Email is required");
            }

            // Check if user exists
            const user = await userServices.getUserByEmail(email, role);

            if (!user) {
                throw new Error("User not found");
            }

            // Generate OTP for password reset
            const otpObject = EmailUtlis.generateOtp();
            user.otp = otpObject.otp;
            user.otpExpiry = otpObject.otpExpiry;

            // Save the updated user with OTP
            await user.save();

            // Send OTP email
            const emailResponse = await EmailUtlis.otpMailForUser({
                body: {
                    receiverEmail: email,
                    subject: 'Password Reset OTP',
                    name: user.name,
                    otpType: 'forgot password',
                    otp: otpObject.otp
                }
            }, res);

            if (emailResponse && emailResponse.status !== 'success') {
                throw new Error('Failed to send OTP email.');
            }

            return res.status(200).json({ message: "OTP sent to your email", success: true });

        } catch (error) {
            return res.status(500).json({ message: error.message });
        }

    },

    resetPasswordUsingOTP: async (req, res) => {
        try {
            const { email, newPassword, otp } = req.body;
            const role = req.params.role;

            if (!email || !newPassword || !otp) {
                throw new Error("Email, new password and OTP are required");
            }

            // Fetch user based on email and role
            const user = await userServices.getUserByEmail(email, role);

            if (!user) {
                throw new Error("User not found");
            }

            // Check if OTP is valid and not expired
            if (user.otp !== otp || Date.now() > user.otpExpiry) {
                throw new Error("Invalid or expired OTP");
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.otp = null; // Clear OTP after successful password change
            user.otpExpiry = null; // Clear OTP expiry

            // Save the updated user
            await user.save();

            return res.status(200).json({ message: "Password changed successfully", success: true });

        } catch (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const { email, role } = req.user; // Assuming user ID is stored in req.user

            if (!email || !currentPassword || !newPassword) {
                throw new Error("Email, old password and new password are required");
            }

            if (currentPassword === newPassword) {
                throw new Error("New password cannot be the same as the old password");
            }

            // Fetch user based on email and role
            const user = await userServices.getUserByEmail(email, role);

            if (!user) {
                throw new Error("User not found");
            }

            // Check if old password is correct
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error("Old password is incorrect");
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Save the updated user
            await user.save();

            return res.status(200).json({ message: "Password updated successfully", success: true });

        } catch (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const { email, role } = req.user; // Assuming user ID is stored in req.user

            if (!email) {
                throw new Error("Email is required");
            }

            // Fetch user based on email and role
            const user = await userServices.getUserByEmail(email, role);

            if (!user) {
                throw new Error("User not found");
            }

            // Delete the user
            await userServices.deletUserAccount(email, role);

            return res.status(200).json({ message: "Account deleted successfully", success: true });

        } catch (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
    },
    updatePhoneProfileImage: async (req, res) => {
        try {
            // code is country code 
            const { email, role, phone, code, imageUrl } = req.body;
            if (role !== "donor") {
                return res.status(400).json({ message: "Only donor can update phone and profile image", success: false });
            }

            if (!email || !role || !phone || !code || !imageUrl) {
                throw new Error("Email, role, phone, code and imageUrl are required");
            }

            const getUser = await userServices.getUserByEmail(email, role);

            const phoneCode = getCountryCallingCode(code)

            const phoneFormat = {
                countryCode: "+" + phoneCode,
                number: phone,
            }


            getUser.phone = phoneFormat;
            getUser.profilePicture = imageUrl;

            await getUser.save();

            res.status(200).json({
                message: "Phone number and profile image updated successfully",
                success: true,
            });

        } catch (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
    },

    getUserProfileController: async (req, res) => {
        try {
            const { email, role } = req.user; // Assuming user ID is stored in req.user

            if (!email || !role) {
                throw new Error("Email and role are required");
            }

            // Fetch user based on email and role
            const user = await userServices.getUserByEmail(email, role);
            var getNgoProfile;
            if (role === 'ngo') {
                getNgoProfile = await NgoServices.getNgoProfileByEmail({ userObjectId: user._id });
            }

            if (!user) {
                throw new Error("User not found");
            }

            return res.status(200).json({
                message: "User profile fetched successfully",
                success: true,
                user: user,
                ngoProfile: role === 'ngo' ? getNgoProfile : {}
            });

        } catch (error) {
            return res.status(500).json({ message: error.message, success: false });
        }
    }


}


export default userController;