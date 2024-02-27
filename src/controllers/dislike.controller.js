import mongoose, { isValidObjectId } from "mongoose";
// import { Dislike } from "../models/dislike.model.js";
import { Dislike} from "../models/dislike.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const userId = req.user?._id;

    if (!isValidObjectId(userId) || !(userId)) throw new ApiError(400, "Invalid user id");
    if (!isValidObjectId(videoId) || !(videoId)) throw new ApiError(400, "Invalid video id");

    const isDisliked = await Dislike.findOne({
        dislikedBy: new mongoose.Types.ObjectId(userId),
        video: new mongoose.Types.ObjectId(videoId)
    });

    if (!isDisliked) {
        await Dislike.create({
            dislikedBy: userId,
            video: videoId,
        });
    } else {
        await Dislike.findByIdAndDelete(isDisliked._id);
        return res.status(200).json(new ApiResponse(200, {}, "Video undisliked successfully"));
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video disliked successfully"));
});

const toggleCommentDislike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const userId = req.user?._id;

    if (!isValidObjectId(userId) || !(userId)) throw new ApiError(400, "Invalid user id");
    if (!isValidObjectId(commentId) || !(commentId)) throw new ApiError(400, "Invalid comment id");

    const isDisiked = await Dislike.findOne({
        dislikedBy: new mongoose.Types.ObjectId(userId),
        comment: new mongoose.Types.ObjectId(commentId)
    })

    if (!isDisiked) {
        await Dislike.create({
            dislikedBy: userId,
            comment: commentId,
        })
    } else {
        await Dislike.deleteOne(isDisiked)
        return res.status(200).json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }

    return res.status(200).json(new ApiResponse(200, {}, "Comment liked successfully"))

})

const toggleTweetDislike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet

    const userId = req.user._id;

    if (!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid User or Tweet ID");
    }

    const tweetDislike = await Dislike.findOne({
        dislikedBy: new mongoose.Types.ObjectId(userId),
        tweet: new mongoose.Types.ObjectId(tweetId),
    });

    if (tweetDislike) {
        await Like.deleteOne(tweetDislike);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet undislike Successfully"));
    } else {
        await Like.create({
            dislikedBy: userId,
            tweet: tweetId,
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet Disliked Successfully"));
});

const getDislikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User or Video");
    }

    const dislikedVideos = await Dislike.aggregate([
        {
            $match: {
                dislikedBy: new mongoose.Types.ObjectId(userId),
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
            new ApiResponse(200, dislikedVideos, "All Liked videos Fetched Successfully")
        );
});

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike, getDislikedVideos};