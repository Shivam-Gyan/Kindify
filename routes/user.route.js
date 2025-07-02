import { Router } from "express";

import userController from "../controllers/user.controllers.js";
import EmailUtlis from "../utils/email.utils.js";
import {loginLimiter} from '../middlewares/rate.limiter.middleware.js'
import uploadImage from "../utils/imageUpload.utlis.js";
import jwtAuthMiddleware from "../middlewares/jwt-auth.middleware.js";



const userRouter = Router();

// accept=".jpg,.png,.jpeg"
// hidden
//onChange={handleBannerUplaod}


userRouter
    .post("/register/:role", userController.registerUser)
    .post('/register/:role/otp-verify',EmailUtlis.optVerify)
    .post('/login/:role',loginLimiter, userController.LoginUser)
    .post('/forgot-password/:role',userController.forgotPassword)
    .post('/reset-password/:role',userController.resetPasswordUsingOTP)
    .post('/update-password',jwtAuthMiddleware,userController.updatePassword)
    .post('/resend-otp/:role',EmailUtlis.resendOtp)
    .post('/upload-profile-picture',uploadImage)
    .delete('/delete-account',jwtAuthMiddleware,userController.deleteAccount)
    .post('/update-phone-image',userController.updatePhoneProfileImage)
    .get('/profile',jwtAuthMiddleware,userController.getUserProfileController)


export default userRouter;