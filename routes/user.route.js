import { Router } from "express";

import userController from "../controllers/user.controllers.js";



const userRouter = Router();
userRouter.post("/register", userController.registerUser);


export default userRouter;