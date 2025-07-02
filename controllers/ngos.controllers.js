import NgoServices from '../services/ngo.svc.js'
import puppeteer from "puppeteer";
import axios from 'axios';



const NgoController = {

    registerNgoController: async (req, res) => {

        try {

            console.log(req.body)

            const { name, role, email, registrationNumber, officialPhone: officialContactPhone, officialEmail: officialContactEmail } = req.body;

            if (!name || !role || !email || !registrationNumber || !officialContactPhone || !officialContactEmail) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required for NGO registration"
                });
            }

            const data = await NgoServices.registerNgoService({
                name,
                email,
                role,
                registrationNumber,
                officialContactPhone,
                officialContactEmail,
            });

            res.status(200).json({
                success: true,
                message: "NGO registered successfully",
                data
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Error registering NGO: ${error.message}`
            });
        }
    },

    filterNgosController: async (req, res) => {

        try {

            const ngos = await NgoServices.filterNgosServices(req)

            // If no NGOs found, return a message
            if (ngos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No NGOs found matching the criteria"
                });
            }

            res.status(200).json({
                success: true,
                message: "NGOs filtered successfully",
                data: ngos
            })

        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Error filtering NGOs: ${error.message}`
            })
        }
    },

    getNgosController: async (req, res) => {
        try {
            const ngos = await NgoServices.getNgosServices();
            res.status(200).json({
                success: true,
                message: "NGOs retrieved successfully",
                data: ngos
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Error retrieving NGOs: ${error.message}`
            });
        }
    },

    getNgoProfileController: async (req, res) => {
        try {
            const { userId, role } = req.user

            if (role !== 'ngo') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only NGOs can view their profile."
                });
            }

            const ngoCompleteProfile = await NgoServices.getNgoProfileServices({ userId });

            if (!ngoCompleteProfile) {
                return res.status(404).json({
                    success: false,
                    message: "NGO not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "NGO retrieved successfully",
                data: ngoCompleteProfile
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Error retrieving NGO: ${error.message}`
            });
        }
    },


    verifyNgoRegistrationNumber: async (req, res) => {
        const { registrationNumber: regNumber } = req.body;

        if (!regNumber || typeof regNumber !== "string") {
            return res.status(400).json({ success: false, message: "Invalid registration number" });
        }

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();

            // Navigate directly to the NGO search page
            await page.goto("https://ngodarpan.gov.in/index.php/search/", {
                waitUntil: "networkidle2",
            });

            // Wait for the form and type the reg number
            await page.waitForSelector("input[name='reg_no']", { timeout: 10000 });
            await page.type("input[name='reg_no']", regNumber);

            // Click the Search button
            await Promise.all([
                page.click("button[name='search']"),
                page.waitForNavigation({ waitUntil: "networkidle2" }),
            ]);

            // Check for result rows
            const ngoDetails = await page.evaluate(() => {
                const resultRow = document.querySelector(".search-result .table-responsive");
                if (!resultRow) return null;

                const firstResultLink = resultRow.querySelector("a");
                return firstResultLink ? firstResultLink.innerText.trim() : null;
            });

            await browser.close();

            if (!ngoDetails) {
                return res.status(404).json({
                    success: false,
                    message: "NGO not found or invalid registration number.",
                });
            }

            return res.status(200).json({
                success: true,
                data: { name: ngoDetails, registrationNumber: regNumber },
            });

        } catch (error) {
            console.error("Scraper error:", error);
            await browser.close();
            return res.status(500).json({
                success: false,
                error: "An error occurred while verifying the NGO.",
            });
        }
    },

    AddAccountDetailsController: async (req, res) => {
        try {

            const { email, role, bankName, accountHolderName, accountNumber, ifscCode, upiId, razorpayPaymentLink, preferredMethod } = req.body;

            if (role !== 'ngo') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only NGOs can add account details."
                });
            }

            if (!bankName || !accountHolderName || !accountNumber || !ifscCode || !upiId || !razorpayPaymentLink || !preferredMethod) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required to add account details"
                });
            }

            const updatedNgoAccount = await NgoServices.addAccountDetailsService(
                {
                    email,
                    role,
                    bankName,
                    accountHolderName,
                    accountNumber,
                    ifscCode,
                    upiId,
                    razorpayPaymentLink,
                    preferredMethod
                }
            );

            res.status(200).json({
                success: true,
                message: "Account details added successfully",
                data: updatedNgoAccount
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Error adding account details: ${error.message}`
            });
        }
    },

    addAddresAndLogoController: async (req, res) => {
        try {
            const { officialContactEmail, role, postalCode, logo } = req.body;

            // if (role !== 'ngo') {
            //     return res.status(403).json({
            //         success: false,
            //         message: "Access denied. Only NGOs can update their profile."
            //     });
            // }



            // if (!postalCode || !logo || !officialContactEmail) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Address and logo are required"
            //     });
            // }

            let details = await axios.get("https://api.postalpincode.in/pincode/" + postalCode)
            details = details.data[0].PostOffice[0]

            if(!details || !details.Pincode ) {
                return res.status(404).json({
                    success: false,
                    message: "Invalid postal code or no details found"
                });
            }

            const formatedAddress = {
                city: details.Region ,
                state: details.State,
                district: details.District,
                postalCode: details.Pincode,
                country: details.Country,
            }

            const updatedNgoProfile = await NgoServices.addAddressAndLogoService({ officialContactEmail, address:formatedAddress, logo });

            res.status(200).json({
                success: true,
                message: "NGO profile updated successfully",
                data: updatedNgoProfile
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: `${error.message}`
            });
        }
    }


}

export default NgoController;