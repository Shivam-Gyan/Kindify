import { Router } from "express";

import userController from "../controllers/user.controllers.js";
import EmailUtlis from "../utils/email.utils.js";
import {loginLimiter} from '../middlewares/rate.limiter.middleware.js'



const userRouter = Router();


userRouter
    .post("/register/:role", userController.registerUser)
    .post('/register/:role/otp-verify',EmailUtlis.optVerify)
    .post('/login/:role',loginLimiter, userController.LoginUser)
    .post('/forgot-password/:role',userController.forgotPassword)
    .post('/reset-password/:role',userController.resetPasswordUsingOTP)
    .post('/update-password/:role',userController.updatePassword)
    .post('/resend-otp/:role',EmailUtlis.resendOtp)


export default userRouter;