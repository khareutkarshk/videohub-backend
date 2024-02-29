import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async(req, res) =>{
    const { channelId } = req.params;

    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }
    console.log(req.user, 'sub');
    console.log(channelId, 'sub');

    const isSubscribed = await Subscription.findOne({
        $and: [
            {subscriber: new mongoose.Types.ObjectId(req.user?._id)},
            {channel: new mongoose.Types.ObjectId(channelId)}
        ]
    })

    if(!isSubscribed){
        const subscriber = await Subscription.create({
            subscriber: new mongoose.Types.ObjectId(req.user?._id),
            channel: new mongoose.Types.ObjectId(channelId),
        })

        if(!subscriber){
            throw new ApiError(500, "Something went wrong")
        }
    } else {
        const unsubscribed = await Subscription.findOneAndDelete(isSubscribed._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {unsubscribed}, "Unsubscribed successfully"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {isSubscribed}, "Subscribed successfully"))
})

const getUserChannelSubscribers = asyncHandler(async(req, res) =>{
    const {channelId} = req.params;

    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "subscribersList",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Get channel subscribers successfully"))
})

const getSubscribedChannels = asyncHandler(async(req, res) =>{
    const {subscriberId} = req.params;

    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const subscribed = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribed, "Get subscribed channels successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
}