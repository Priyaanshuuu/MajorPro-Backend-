import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import {ApiError} from '../utils/ApiError.js'

//  Tokens are the stuffs that are used for authentication and authorization
//  Access token is used for the short duration
// Refresh tokens are used for the longer duration
// The value of the access token gets matched with the token value with the token value stored in the DB 
// If both the value matches the user doesn't need to reauthorise himself/herself


const generateAccessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

   

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log("Access Token Generated:", accessToken);
    console.log("Refresh Token Generated:", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error during token generation:", error.message);
    throw new ApiError(500, "Something went wrong in generating Access and Refresh Tokens");
  }
};


const registerUser = asyncHandler(async (req, res)=> {
    
    
    

    const {fullName,email, username, password} = req.body // isse jo required chize hai wo frontend se aaingi

    // yeh jo niche waala code hai uski jgh seperate if-else use krr skte hai that will be more begineer friendly 
    // Thoda saa Adv code hai but production based codes aisse hi hoote

    if(
        [fullName, email, username, password].some((field)=> field?.trim() ==="")
      ) {
        throw new ApiError(404,"All fields are required")
      }
      // Upr waale condn see saare jo fields check honge taaki koisi bhi field empty na rhee

      
      

      const existedUser = await User.findOne({
        $or: [{ username }, { email }]
      })

      //console.log("Dublicate user is found:",existedUser);
      // isse recheck honge users that whether they already exists
      // findOne is a feature provided by MondoDB in which it returns the first o/p that matches

      if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
      }

      console.log(existedUser);

      const avatarLocalPath =  req.files.avatar[0].path;

      let coverImageLocalPath;
      if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
      }
      // isArray is a method through which we can check the required file is an array or not
      // Here it check whether "req.files.coverImage" provides an array oe not
      //The reason of doing this is that ki the elements of the array can be accessed easily
      // Through accessibg the elements additional functionalities can be add to it

      const avatar = uploadOnCloudinary(avatarLocalPath)
      const coverImage = uploadOnCloudinary(coverImageLocalPath)

      if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
      }

      const user = await User.create({
        fullName,
        avatar: avatarLocalPath,
        coverImage: coverImageLocalPath || "",
        email,
        password,
        username : username
      })

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

      if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
      }

      /*return res.status(201).json(
        
        const response = new ApiResponse(200,  createdUser, "User registered Successfully"),
        console.log("The user's data is like: ", )
        
      )*/

        const response = new ApiResponse(200, createdUser, "User registered successfully");
         console.log("Response object:", response); // Log final response object

             return res.status(201).json(response);
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh Token is used or expired")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)

    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newrefreshToken},
        "Access Token Refreshed"
      )
    )

    
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username and email are required");
  }

  // Find the user
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Validate the password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  // Generate tokens after successful login
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true // Set to true for HTTPS connections
  };

  // Return the response with tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  )
  
  const options = {
    httpOnly: true,
    secure: true
  }
  
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200,{}, "User logged Out"))
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid Old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200,{}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    req.user,
    "User fetched successfully"
  ))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body

  if(!fullName && !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {// It is  a mongoDB operator that is used for updation
        // here this operator updates the fullname and email 
        // the updated value will be taken from the req.body
        fullName,
        email: email
      }
    },
  ).select("-password")
  // Abb update knre ke liye user login kregee toh jbb value update hooo jaegi toh sirf updated values ho=i show hooni chahiye
  // Here the values that are to be updated are fullname and email so sirf whi show hooga
  // select is a mongoose operator which decides which value is to be excluded or will be included
  // The exclusion and inclusion will be determined by the signs(+/-) or true/false values eg (-password) means exclusion and (true password means inclusion)

  return res 
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))

});

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar File is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) {
    throw new ApiError(400,"Error while uploading the Avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res 
  .status(200)
  .json(new ApiResponse(200, user, "Avatar Image updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
      throw new ApiError(400, "Error while uploading thr avatar")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          coverImage: coverImage.url
        }
      },
      {new: true}
    ).select("-password")

    return res 
  .status(200)
  .json(new ApiResponse(200, user, "Cover Image updated successfully"))

    
  }
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400,"Username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subcribers"
        },
        channelsSubscribedToCount: {
          $size: "$subcribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subcriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if(!channel?.length) {
    throw new ApiError(404,"Channel does not exists")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $lookup: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner"
        }
      }
    }
  ])
  
  return res
.status(200)
.json(
  new ApiResponse(200,user[0].watchHistory,"Watch history fetched Successfully")
)
})


       


export {
  registerUser,
  logoutUser,
  loginUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

}