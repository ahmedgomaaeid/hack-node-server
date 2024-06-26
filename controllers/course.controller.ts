import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from 'cloudinary'
import { createCourse, getAllcoursesServices } from "../services/course.services";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs"
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";


// upload course : 
export const uploadCourse = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const data = req.body ; 
            const thumbnail = data.thumbnail ;
            if (thumbnail) {
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail , {
                    folder : "courses"
                })

                data.thumbnail = {
                    public_id : myCloud.public_id , 
                    url : myCloud.secure_url
                }
            }

            

            createCourse(data , res , next)


        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// edit course : 
export const editCourse = CatchAsyncError(
    async (req:Request , res:Response , next : NextFunction) => {
        try {
           const data = req.body 
           
           const thumbnail = data.thumbnail

           const courseId = req.params.id;

           const courseData = await CourseModel.findById(courseId) as any;

           if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
    
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
              folder: "courses",
            });
    
            data.thumbnail = {
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
            };
          }

          if (thumbnail.startsWith("https")) {
            data.thumbnail = {
              public_id: courseData?.thumbnail.public_id,
              url: courseData?.thumbnail.url,
            };
          }

          

           const course = await CourseModel.findByIdAndUpdate(
            courseId ,
            {$set : data} , 
            {new:true}
        )

        await redis.set(courseId, JSON.stringify(course));

        res.status(201).json({
            success : true , 
            course
        })

        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// getsingle course -- whitout purchasing : 
export const getSingleCourse = CatchAsyncError(
    async (req:Request , res : Response , next : NextFunction) => {
        try {

            const courseId = req.params.id 

            const isCacheExist  = await redis.get(courseId)

            if(isCacheExist) {
                const course = JSON.parse(isCacheExist)
                res.status(200).json({
                    success : true , 
                    course
                })
            } else {
                const course = await CourseModel.findById(req.params.id).select(
                    "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
                  );
                  
                await redis.set(courseId , JSON.stringify(course) , "EX" , 604800)
        
                res.status(200).json({
                   success : true , 
                    course
                  })
            }
          
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// get all courses -- without purshasing: 
export const getAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
  
        res.status(200).json({
          success: true,
          courses,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

// get course content -- only for valid user : 
export const getCourseByUser = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const userCourseList = req.user?.courses
            const courseId = req.params.id 
            
            const courseExists = userCourseList?.find(
                (course:any) => course._id.toString() === courseId
            );

            if(!courseExists) {
                return next(
                    new ErrorHandler("You are not eligible to access this course" , 404)
                )
            }

            const course = await CourseModel.findById(courseId)

            const content = course?.courseData

            res.status(200).json({
                success : true , 
                content 
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// Add question in course : 
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
  }

export const addQuestion = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const {question , courseId , contentId} :IAddQuestionData = req.body
            const course = await CourseModel.findById(courseId)

            if(!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("invalid content id !", 400))
            }

            const courseContent = course?.courseData.find(
                (item:any) => item._id.equals(contentId)
            )

            if(!courseContent) {
                return next(new ErrorHandler("invalid content 2 id !" , 400))
            }

            // create a new question content : 
            const newQuestion: any = {
                user: req.user,
                question,
                questionReplies: [],
              };

            // add this question to the courses content : 
            courseContent.questions.push(newQuestion)

            await NotificationModel.create({
                user: req.user?._id,
                title: "New Question Received",
                message: `You have a new question in ${courseContent.title}`,
              });

            // save the updated course : 
            await course?.save()

            res.status(200).json({
                success : true , 
                course
            })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// add answer in course question
interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
  }

export const addAnswer = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
          const { answer , courseId , contentId , questionId }:IAddAnswerData = req.body
          
          const course = await CourseModel.findById(courseId)

          if(!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("invalid content id !", 400))
          }

          const courseContent = course?.courseData.find(
            (item:any) => item._id.equals(contentId)
          )

        if(!courseContent) {
            return next(new ErrorHandler("invalid content id !" , 400))
        }

        const question = courseContent.questions.find((item:any) => item._id.equals(questionId))

        if(!question) {
            return next(new ErrorHandler("invalid question !" , 400))
        }

        // Create a new answer object : 
        const newAnswer: any = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

        //  add this answer to our course content : 
        question.questionReplies.push(newAnswer);

        await course?.save()

        if(req.user?._id === question.user._id) {
            // Create a notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent.title}`,
              });
        } else {
            const data = {
                name : question.user.name , 
                title : courseContent.title
            }

            const html = await ejs.renderFile(path.join(__dirname , "../mails/question-reply.ejs") , data)

            try {
                await sendMail({
                    email : question.user.email , 
                    subject : "Question Reply" , 
                    template : "question-reply.ejs" , 
                    data
                })
            } catch (error : any) {
                return next(new ErrorHandler(error.message , 500))
            }

            
        }

        res.status(200).json({
            sucess : true , 
            course
        })

        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// add review in course : 
interface IAddReviewData {
    review : string , 
    rating : string , 
    userId : string 
}

export const addReview = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const userCourseList = req.user?.courses

            const courseId = req.params.id 

            // check if courseId already exist is userCourseList based on _id : 
            const courseExists = userCourseList?.some(
                (course : any) => course._id.toString() === courseId.toString()
            )

            if(!courseExists) {
                return next(new ErrorHandler("your are not eligible to access this course" , 404))
            }

            const course = await CourseModel.findById(courseId)

            const {review , rating} = req.body as IAddReviewData

            const reviewData : any ={
                user : req.user , 
                rating , 
                comment : review
            }

            course?.reviews.push(reviewData)

            let avg = 0 ; 

            course?.reviews.forEach((rev:any) => {
                avg += rev.rating
            })

            if(course) {
                course.ratings = avg / course.reviews.length // an example : we have 2 ratings for this course : first is 5 and the second is 4 so the math is working like this : 9/2=4.5
            }

            await course?.save()

            await redis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

            // create notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Review Received",
                message: `${req.user?.name} has given a review in ${course?.name}`,
            });

            res.status(200).json({
                success : true , 
                course
            })

        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// Add reply to the review --only for admin : 
interface IAddRReplyData {
    comment : string , 
    courseId : string , 
    reviewId : string
}

export const addReplyToReview = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
           const {comment , courseId , reviewId} = req.body as IAddRReplyData 

           const course = await CourseModel.findById(courseId)

           if(!course) {
            return next(new ErrorHandler("course not found" , 400))
           }

           const review = course.reviews.find((rev:any) => rev._id.toString() === reviewId)

           if(!review) {
            return next(new ErrorHandler("Review not found" , 404))
           }

           const replyData: any = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
    

           if(!review.commentReplies) {
            review.commentReplies = []
           }

           review.commentReplies.push(replyData)

           res.status(200).json({
            success : true , 
            course
           })
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 500))
        }
    }
)

// get all courses --only for admin : 
export const getAllCoursesAdmin = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
           getAllcoursesServices(res) 
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 400))
        }
    }
)

// delete course : 
export const deleteCourse = CatchAsyncError(
    async (req:Request , res:Response , next:NextFunction) => {
        try {
            const {id} = req.params

            const course = await CourseModel.findById(id)

            if(!course) {
                return next(new ErrorHandler("course not found" , 404))
            }

            await course.deleteOne({id})

            await redis.del(id)

            res.status(200).json({
                success : true ,
                message : "Course Deleted Successfully"
            })
            
        } catch (error : any) {
            return next(new ErrorHandler(error.message , 400))
        }
    }
    )