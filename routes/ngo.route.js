import express from 'express';

import NgoController from '../controllers/ngos.controllers.js';


const NgoRouter = express.Router();


NgoRouter
    .get('/filter-ngos', NgoController.filterNgosController)
    .get('/get-ngos', NgoController.getNgosController)
    .get('/profile-ngo', NgoController.getNgoProfileController)
    .post('/verify-registration-number', NgoController.verifyNgoRegistrationNumber)
    .post('/register-ngo', NgoController.registerNgoController)
    .post('/add-account-details', NgoController.AddAccountDetailsController)
    .post('/add-address-and-logo', NgoController.addAddresAndLogoController)


export default NgoRouter;