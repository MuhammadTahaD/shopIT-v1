// Check if user is authenticated or not

import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js"
import { request } from "express";
import User from "../models/user.js";

export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if(!token) {
        return next(new ErrorHandler('Login first to access this resources', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    req.user = await User.findById(decoded.id)

    next(); 
});


// Authorize user roles

export const authorizeRoles = (...roles) => {
return (req, res, next) => {
    if (!roles.includes(req.user.role)){
      return next(
        new ErrorHandler(
            `Role (${req.user.role}) is not allowed to acces the resource`, 403
        )
    );
}
next();

};

};