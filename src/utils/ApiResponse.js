// This file is created to handle the APIs

class ApiResponse {
    constructor(statusCode,data,message = "Success"){
        this.statusCode = statusCode, // handles the https status code
        this.data= data, // handles the data that comes from the API, it can be anything an array, an object
        this.message = message, // Here it is by default success but it describes the result
        this.success = statusCode < 400
    }
}

export {ApiResponse}