import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "").trim()
        // The upr waala code access the JWT either from the cookies or from the header part

        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // The upr waala code tries to verify the token using the secret key stored in the env file

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        // The upr waala code is used to find the user using the decoded token

        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }

        req.user = user;
        next()
        
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})