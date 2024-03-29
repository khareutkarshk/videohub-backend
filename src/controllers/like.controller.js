import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const userId = req.user?._id;

    if (!isValidObjectId(userId) || !(userId)) throw new ApiError(400, "Invalid user id");
    if (!isValidObjectId(videoId) || !(videoId)) throw new ApiError(400, "Invalid video id");

    const isLiked = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        video: new mongoose.Types.ObjectId(videoId)
    })

    if (!isLiked) {
        await Like.create({
            likedBy: userId,
            video: videoId,
        })
    } else {
        await Like.findByIdAndDelete(isLiked._id)
        return res.status(200).json(new ApiResponse(200, {}, "Video unliked successfully"))
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video liked successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const userId = req.user?._id;

    if (!isValidObjectId(userId) || !(userId)) throw new ApiError(400, "Invalid user id");
    if (!isValidObjectId(commentId) || !(commentId)) throw new ApiError(400, "Invalid comment id");

    const isLiked = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        comment: new mongoose.Types.ObjectId(commentId)
    })

    if (!isLiked) {
        await Like.create({
            likedBy: userId,
            comment: commentId,
        })
    } else {
        await Like.deleteOne(isLiked)
        return res.status(200).json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment liked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    const userId = req.user._id;

    if (!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid User or Tweet ID");
    }

    const tweetLike = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        tweet: new mongoose.Types.ObjectId(tweetId),
    });

    if (tweetLike) {
        await Like.deleteOne(tweetLike);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet unlike Successfully"));
    } else {
        await Like.create({
            likedBy: userId,
            tweet: tweetId,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet Liked Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User or Video");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "AllVideos",
            },
        },
        {
            $unwind: {
                path: "$AllVideos",
            },
        },
        {
            $project: {
                _id: "$AllVideos._id",
                owner: "$AllVideos.owner",
                title: "$AllVideos.title",
                videoFile: "$AllVideos.videoFile",
                createdAt: "$AllVideos.createdAt",
            },
        },
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideos, "All Liked videos Fetched Successfully")
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };