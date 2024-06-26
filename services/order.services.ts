import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";

export const newOrder = CatchAsyncError(
    async (data:any , next : NextFunction) => {
        const order = await OrderModel.create(data) ; 
        next(order)
        
    }
)

// get all orders : 
export const getAllordersServices = async(res:Response) => {
    const orders = await OrderModel.find().sort({
        createdAt : -1
    })

    res.status(201).json({
        success : true , 
        orders
    })
}