import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { getNotification, updateNotification } from '../controllers/notification.controller'
import { updateAccessToken } from '../controllers/user.controller'

const notificationRoute = express.Router()

notificationRoute.get(
    "/get-notifications" , 
    isAuthenticated , 
    authorizeRoles("admin") , 
    getNotification
)

notificationRoute.put(
    "/update-notification/:id" , 
    isAuthenticated , 
    authorizeRoles("admin") , 
   updateNotification
)



export default notificationRoute