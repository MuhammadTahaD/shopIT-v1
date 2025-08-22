class ErrorHandler extends Error {
    constructor(message, statusCode){
        super(message)
        this.statusCode = statusCode;

        // Create Stack Property
        Error.captureStackTrace(this, this.constructor);
    }
}


export default ErrorHandler