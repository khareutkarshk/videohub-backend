import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "This video id is not valid");
    }

    try {
        // Find video in database
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Match and find all the comments with owner details
        
        const aggregateComments = await Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner",
                    },
                }
            }
        ]);

        return res.status(200).json(new ApiResponse(200, aggregateComments, "Video comments fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching video comments", error);
    }
});






const addCommentToVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!content || content.trim() === "" || content.trim() === undefined) {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    console.log(req.user);

    const userComment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id,
    })

    if (!userComment) {
        throw new ApiError(500, "Something went wrong while adding comment to video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userComment, "User commented to video successfully")
        );
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (!content || content.trim() === "" || content.trim() === undefined) {
        throw new ApiError(400, "Comment content is required")
    }

    if (comment.commentedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment")
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
        throw new ApiError(500, "Something went wrong while updating comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Update comment successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (comment.commentedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Something went wrong while deleting comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedComment, "Delete comment successfully"))
})

export {
    getVideoComments,
    addCommentToVideo,
    updateComment,
    deleteComment,
}