import cloudinary from 'cloudinary';


cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadImage = async (req, res) => {
    try {
        const { image } = req.files;
        let cloudinaryResponse;

        cloudinaryResponse = await cloudinary.uploader.upload(
            image.tempFilePath
        );

        return res.status(200).json({
            success: true,
            message: "upload successfull",
            image_url: cloudinaryResponse.secure_url
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong while uploading the image",
        });
    }



}


export default uploadImage;