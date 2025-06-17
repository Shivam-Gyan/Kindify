import express from "express";
import DonorController from "../controllers/donor.controllers.js";
import jwtAuthMiddleware from "../middlewares/jwt-auth.middleware.js";


const DonorRouter= express.Router();

DonorRouter
    .post("/update-personal-information",jwtAuthMiddleware, DonorController.updateDonorPersonalInfo)




export default DonorRouter;


