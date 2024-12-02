import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

// We are taking two way upload procedure as it is a good production based practise
// Pehle hmlog jis file ko upload krana hai usse ek temporary jgh pe store krr denge
// Phir whaa se uss file ko cloudinary pe upload krr denge

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY,

});

const uploadOnCloudinary = async (localFilePath)=> {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // uper waale code se file has been uploaded successfully

        fs.unlinkSync(localFilePath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // removes the locally saved temporary file as the upload operation got failed
        return null;
    }

}

export {uploadOnCloudinary}