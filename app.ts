require("dotenv").config()
import express, { NextFunction, Request, Response } from "express"
export const app = express() 
import cors from "cors"
import cookieParser from 'cookie-parser'
import { errorMiddleware } from "./middleware/error"
import userRouter from "./routes/user.route"
import courseRouter from "./routes/course.route"
import orderRouter from "./routes/order.route" 
import notificationRoute from "./routes/notifications.route"
import analyticsRouter from "./routes/analytics.route"
import layoutRouter from "./routes/layout.route"    
 
// Body parser : 
app.use(express.json({limit : "50mb"})) // for the limit of the body parser data.

// Cookie parser :
app.use(cookieParser());  

// // cors => cross origin resources sharing :(we can add a property in which origin we can access this api ...)
// app.use( 
//     cors({
//         origin : ["http://localhost:3000"],
//         credentials:true
//     })     
// )
  
app.use("/api/v1" , userRouter , courseRouter , orderRouter ,notificationRoute , analyticsRouter , layoutRouter)

// testing api : 
app.get("/" , (req:Request , res:Response , next:NextFunction) => {  
    res.status(200).json({  
        success : true , 
        message : "API is working" ,     
    }) 
}) 
app.get("/test" , (req:Request , res:Response , next:NextFunction) => {  
    res.status(200).json({  
        success : true , 
        message : "API is working" ,     
    }) 
}) 

// Unknown route : 
app.all("*" , (req:Request , res:Response , next:NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404 ; 
    next(err) 
})

app.use(errorMiddleware)   

