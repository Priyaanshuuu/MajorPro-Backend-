//Iss code kkaa kaam hai routes mein error handle krna
// Agr yeh code ni likhte toh baar baar hrr route waale code ko try catch mein daalna pdta
//Agr kisi route mein error milgtga hai toh woh information agle route mein pass krrdi jaegi
// Agr koi error milta hai toh instead of crashing the app the error is passed to the next route
// Aur most probably next route ek error handling route hoota hai

const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}
export {asyncHandler}




/*

const asyncHandler = (fn)=> async(req,res,next)=> {
    try {
        await fn(req.res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
        
    }
}*/