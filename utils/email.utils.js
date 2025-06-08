import crypto from 'crypto';

const EmailUtlis = {

    generateOtp: function () {
        return {
            otp: crypto.randomInt(100000, 999999).toString(),
            otpExpiry: new Date(Date.now() + 5 * 60000) // 5 minutes
        }
    },
    

    optVerify: async (req, res) => {

        const { otp, email } = req.body;
        const user = await userService.getByEmail(email);
        if (!user) {
            return res.status(404).json({
                error: "Not Found",
                errorDescription: "User not found."
            });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                error: "Invalid OTP",
                errorDescription: "The OTP provided is invalid."
            });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                error: "Expired OTP",
                errorDescription: "The OTP provided has expired."
            });
        }

        // Clear the OTP and OTP expiry
        user.emailVerified = true;
        user.otp = null;
        user.otpExpiry = null;

        // Save the user
        await user.save();

        res.status(200).json({
            message: "Email verified successfully."
        });
    },

    resendOtp: async (req, res) => {

        const { email } = req.body;
        const user = await userService.getByEmail(email);

        if (!user) {
            return res.status(404).json({
                error: "Not Found",
                errorDescription: "User not found."
            });
        }
        if (user.isLocked) {
            return res.status(500).json({
                error: "Locked Account",
                message: "Account is Locked.Contact Admin"
            })
        }

        if (user.emailVerified) {
            return res.status(400).json({
                error: "Already Verified",
                errorDescription: "The email address is already verified."
            });
        }

        // Generate a new OTP
        const otpObject = Validation.generateOtp();

        // Update the user
        user.otp = otpObject.otp;
        user.otpExpiry = otpObject.otpExpiry;

        // Save the user
        await user.save();

        const emailResponse = await mailerCtrl.otpMailForUser({
            body: {
                receiverEmail: email,
                subject: 'Email Verification',
                userName: `${user.firstName} ${user.lastName}`,
                otpType: 'resend',
                otp: otpObject.otp
            }
        }, res);

        if (emailResponse && emailResponse.status !== 'success') {
            return res.status(500).json({ error: 'Failed to send email.' });
        }

        res.status(200).json({
            message: "OTP sent successfully.Please check your email."
        });
    },
}