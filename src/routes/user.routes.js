/*import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)

export default router*/

import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getWatchHistory,  getUserChannelProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(upload.fields(
    [
        { name: 'avatar',
            maxCount:1,
         },
        { name: 'coverImage',
            maxCount: 1,
         }
    ]
    ),
     registerUser);

// Upr waale code me jo router se pehle upload.fields likhe hai woh ek middleware ki trh kaam kregaa
// Upload naam se hmne middleware ko export krrwaya hai

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser) // Here the verifyJWT is a middleware
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)// Postman mein ek authorization header bnana pdta jisme token value daalna pdta
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage", updateUserCoverImage))
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router;
