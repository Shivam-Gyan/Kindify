import UserModel from "../models/user.model.js";

const userServices={

    registerDonor:async(data)=>{
        try{
            const {name, email,password}= data;

            if(!name || !email || !password){
                throw new Error("Email and password are required");
            }
            

            const donor= await UserModel.create({
                name:name,
                email: email,
                password: password,
                role: "donor"
            });

            return donor;

        }catch(error){
            throw new Error("Error in loginDonor service: " + error.message);
        }
    },

    loginDonor:async(data)=>{

    },

    registerNgo:async(data)=>{

    },

    loginNgo:async(data)=>{

    },

    // this fucntion return the user details by email id irrespective of role
    checkUserExistsWithEmail:async(email)=>{
        try{
            if(!email){
                throw new Error("oops! Email is required");
            }

            const donor = await UserModel.exists({ email: email });

            // if donor is not found, return false
            if(!donor){
                return false;
            }
            // if donor is found, return true
            return true;

        }catch(error){
            throw new Error("Error in getDonorbyEmail service: " + error.message);
        }
    }
}

export default userServices;