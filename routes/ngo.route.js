import express from 'express';

import NgoController from '../controllers/ngos.controllers.js';
import jwtAuthMiddleware from '../middlewares/jwt-auth.middleware.js';


const NgoRouter = express.Router();


NgoRouter
    .get('/filter-ngos', NgoController.filterNgosController)
    .get('/get-ngos', NgoController.getNgosController)
    .get('/profile-ngo', NgoController.getNgoProfileController)
    .get('/get-ngo-profile/:ngoUserObjectId', NgoController.getNgoDetailsController)
    .post('/follow-ngo', jwtAuthMiddleware, NgoController.followNgoController)
    .post('/verify-registration-number', NgoController.verifyNgoRegistrationNumber)
    .post('/register-ngo', NgoController.registerNgoController)
    .post('/add-account-details', NgoController.AddAccountDetailsController)
    .post('/add-address-and-logo', NgoController.addAddresAndLogoController)


export default NgoRouter;