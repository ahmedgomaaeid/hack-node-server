import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

// Create course : 
export const createCourse = CatchAsyncError(
    async (data:any , res:Response) => {
        const course = await CourseModel.create(data) ; 
        res.status(201).json({
            success : true , 
            course
        })
    }
)

// get all courses : 
export const getAllcoursesServices = async(res:Response) => {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
  
    res.status(201).json({
      success: true,
      courses,
    });
}