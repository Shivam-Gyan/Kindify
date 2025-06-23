import express from "express";
import jwtAuthMiddleware from "../middlewares/jwt-auth.middleware.js";
import ContactAndQuery from "../controllers/contactAndQuery.controller.js";


const ContactAndQueryRouter = express.Router();

ContactAndQueryRouter
    .post("/:type",jwtAuthMiddleware, ContactAndQuery.generalQuery);

export default ContactAndQueryRouter;