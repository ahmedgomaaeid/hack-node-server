import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import { generateLast12MothsData } from "../utils/analytics.generate";

// get users analytics -- only for admin : 
export const getUsersAnalytics = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const users = await generateLast12MothsData(userModel)

            res.status(200).json({
                success : true , 
                users
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)
// get Courses analytics -- only for admin : 
export const getCoursesAnalytics = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const Courses = await generateLast12MothsData(CourseModel)

            res.status(200).json({
                success : true , 
                Courses
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)
// get Orders analytics -- only for admin : 
export const getOrdersAnalytics = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const Orders = await generateLast12MothsData(OrderModel)

            res.status(200).json({
                success : true , 
                Orders
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)