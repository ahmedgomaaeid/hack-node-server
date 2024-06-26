import express from 'express'
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socalAuth, updateAccessToken, updatePassword, updateProfilePicture, updateUserInfo, updateUserRole } from '../controllers/user.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
const userRouter = express.Router()

userRouter.post('/registration' , registrationUser)
userRouter.post('/activate' , activateUser)
userRouter.post('/login' , loginUser)
userRouter.post('/social-auth' , socalAuth)
userRouter.get('/refresh' , updateAccessToken)
userRouter.get('/logout'  ,  isAuthenticated, logoutUser)
userRouter.get('/me' , isAuthenticated, getUserInfo)
userRouter.put('/update-user' , isAuthenticated, updateUserInfo)
userRouter.put('/update-password' , isAuthenticated, updatePassword)
userRouter.put('/update-avatar' , isAuthenticated, updateProfilePicture)
userRouter.get('/get-users' , isAuthenticated , authorizeRoles("admin"), getAllUsers)
userRouter.put('/update-user-role' , isAuthenticated , authorizeRoles("admin"), updateUserRole)
userRouter.delete('/delete-user/:id' , isAuthenticated , authorizeRoles("admin"), deleteUser)

export default userRouter 