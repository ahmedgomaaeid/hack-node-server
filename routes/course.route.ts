import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourses,  getAllCoursesAdmin, getCourseByUser, getSingleCourse, uploadCourse } from '../controllers/course.controller'

const courseRouter = express.Router()

courseRouter.post(
    "/create-course" ,
    isAuthenticated , 
    authorizeRoles("admin") , 
    uploadCourse
)

courseRouter.put(
    "/edit-course/:id" , 
    isAuthenticated , 
    authorizeRoles("admin") , 
    editCourse
)
courseRouter.get(
    "/get-course/:id" , 
    getSingleCourse
)
courseRouter.get(
    "/get-courses" , 
    getAllCourses
)
courseRouter.get(
    "/get-course-user/:id" , 
    isAuthenticated , 
    getCourseByUser
)
courseRouter.put(
    "/add-question" , 
    isAuthenticated , 
    addQuestion
)
courseRouter.put(
    "/add-answer" ,
    isAuthenticated , 
    addAnswer
)
courseRouter.put(
    "/add-review/:id" ,
    isAuthenticated , 
    addReview
)
courseRouter.put(
    "/add-reply-review" , 
    isAuthenticated ,
    authorizeRoles("admin") , 
    addReplyToReview
)

// courseRouter.get('/get-courses' , isAuthenticated , authorizeRoles("admin"))
courseRouter.get(
    "/get-admin-courses",
    isAuthenticated,
    authorizeRoles("admin"),
    getAllCoursesAdmin
  );
courseRouter.delete('/delete-course/:id' , isAuthenticated , authorizeRoles("admin"), deleteCourse  )

export default courseRouter