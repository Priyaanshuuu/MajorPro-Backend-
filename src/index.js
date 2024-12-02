//import mongoose from "mongoose";
//import {DB_NAME} from "./constants.js"


// dotenv waala method dusra tarika hai jisse DB se connection establish hooga
// Issme bhaangbhosda waala kaam durse file mein hoo rkha jisse import karaya gaya hai

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on the port ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
  console.log("MONGO db connection failed !!!", err);
  
})

 


// The below code is one of the two to establish connection with the database

/*import express from "express"
const app = express()
 (async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("ERROR", (error)=>{
           console.log("ERROR", error);
           throw error
        })
            
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORTPORT}`);
            
        })

    } catch (error) {
        console.log("ERROR:", error);
        throw err
    }
 })()*/