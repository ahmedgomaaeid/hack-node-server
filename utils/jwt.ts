require("dotenv").config()
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";



interface ITokenOptions {
    expires : Date ; 
    maxAge : number ; 
    httpOnly : boolean ;
    sameSite : "lax" | "strict" | "none" | undefined ; 
    secure?: boolean
}

// Parse enviroment variables to integrates with fallback values : 
export const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPIRED || "300" , 10
)
export  const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPIRED || "1200" , 10
)

// Option for cookies : 
export const accessTokenOptions : ITokenOptions = {
    expires : new Date(Date.now() + accessTokenExpire*3600000),
    maxAge : accessTokenExpire*3600000 , 
    httpOnly : true , 
    sameSite : 'lax'
}

export const refreshTokenOptions : ITokenOptions = {
    expires : new Date(Date.now() + refreshTokenExpire*86400000),
    maxAge : refreshTokenExpire*86400000 , 
    httpOnly : true , 
    sameSite : 'lax'
}

export const sendToken = (user:IUser , statusCode : number , res : Response) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // Upload session to redis : 
    redis.set(user._id , JSON.stringify(user) as any)

    

    // only set secure to true in production : 
    if(process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true
    }

    res.cookie("access_token" , accessToken ,accessTokenOptions )
    res.cookie("refresh_token" , refreshToken ,refreshTokenOptions )

    res.status(statusCode).json({
        success : true , 
        user ,
        accessToken
    })
}