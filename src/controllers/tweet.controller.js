import mongoose, {isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req, res) =>{
    const {content} = req.body;

    const user = User.findById(req.user?._id);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    if(
        [content].some((arg) => arg.trim() === "" || arg.trim() === undefined)
    ){
        throw new ApiError(401, "All fields are required");
    }

    const tweet = await Tweet.create({
        content,
        owner: user._id,
    });

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

const getUserTweets = asyncHandler(async(req, res) =>{
    const {userId} = req.params;

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const userTweet = await Tweet.aggregate([
        {
            $match: {
                owner: user._id,
            }
        }
    ]);

    if(!userTweet){
        throw new ApiError(404, "User has no tweets");
    }

    return res.status(200).json(new ApiResponse(200, {userTweet}, "User tweets retrieved successfully"));
})

const updateTweet = asyncHandler(async(req, res) =>{

    const {tweetId} = req.params;
    const {content} = req.body;

    if(
        [content].some((arg) => arg.trim() === "" || arg.trim() === undefined)
    ){
        throw new ApiError(401, "All fields are required");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            }
        },
        {
            new: true,
        }
    );

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You are not authorized to perform this action");
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async(req, res) =>{
    const {tweetId} = req.params;

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(401, "You are not authorized to perform this action");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})

export {createTweet, getUserTweets, updateTweet, deleteTweet}