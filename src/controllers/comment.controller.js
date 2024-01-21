import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if (videoId || !isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video ID"))
    }

    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);

    if (page <= 0) page = 1;
    if (limit <= 0) limit = 10;

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
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
        },
        {
            $addFields: {
                commentedBy: {
                    $first: "$commenteedBy",
                }
            }
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: limit,
        },
        {
            $sort: {
                createdAt: -1,
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, videoComments, "Get video comments successfully"))
})

const addCommentToVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId || !isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video ID"))
    }

    if (!content || content.trim() === "" || content.trim() === undefined) {
        return next(new ApiError(400, "Comment content is required"))
    }

    const video = await Video.findById(videoId);

    if (!video) {
        return next(new ApiError(404, "Video not found"))
    }

    const userComment = await Comment.create({
        content: content.trim(),
        video: videoId._id,
        commentedBy: req.user?._id,
    })

    if (!userComment) {
        return next(new ApiError(500, "Something went wrong while adding comment to video"))
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !isValidObjectId(commentId)) {
        return next(new ApiError(400, "Invalid comment ID"))
    }

    if (!content || content.trim() === "" || content.trim() === undefined) {
        return next(new ApiError(400, "Comment content is required"))
    }

    if (comment.commentedBy.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, "You are not allowed to update this comment"))
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: content.trim(),
        },
        {
            new: true
        }
    )

    if (!updatedComment) {
        return next(new ApiError(500, "Something went wrong while updating comment"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Update comment successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
        return next(new ApiError(400, "Invalid comment ID"))
    }

    if (comment.commentedBy.toString() !== req.user._id.toString()) {
        return next(new ApiError(403, "You are not allowed to delete this comment"))
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        return next(new ApiError(500, "Something went wrong while deleting comment"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedComment, "Delete comment successfully"))
})

export {
    getVideoComments,
    addCommentToVideo,
    updateComment,
    deleteComment,}