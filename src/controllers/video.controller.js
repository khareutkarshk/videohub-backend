import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished = true } = req.body;

    if ([title, description].some(
        (field) => field?.trim() === ""
    )) {
        throw new ApiError(400, `${field} is required`);
    }

    let videoLocalPath;
    let thumbnailLocalPath;

    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoLocalPath = req.files.videoFile[0].path;
    }
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    console.log('Video', videoFile);
    console.log('Thumbnail', thumbnail);

    const user = await User.findById(req.user?._id).select("-password -refreshToken");

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished,
        owner: user._id,
    })

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
            },
        },
        {
            $project: {
                likes: 0,
            },
        },
    ]);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));


})

const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        query = " ",
        sortBy,
        sortType,
        userId,
    } = req.query;

    console.log("query ", query, " userId ", userId);
    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(page) ? 10 : Number(limit);

    //because 0 is not acceptable ein skip and limit in aggregate pipeline
    if (page < 0) {
        page = 1;
    }
    if (limit <= 0) {
        limit = 10;
    }

    const matchStage = {};

    if (userId && isValidObjectId(userId)) {
        matchStage["$match"] = {
            owner: new mongoose.Types.ObjectId(userId),
        };
    } else if (query) {
        matchStage["$match"] = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        };
    } else {
        matchStage["$match"] = {};
    }
    if (userId && query) {
        matchStage["$match"] = {
            $and: [
                { owner: new mongoose.Types.ObjectId(userId) },
                {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } },
                    ],
                },
            ],
        };
    }

    const sortStage = {};
    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1,
        };
    } else {
        sortStage["$sort"] = {
            createdAt: -1,
        };
    }

    const videos = await Video.aggregate([
        matchStage,
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        sortStage,
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
                likes: {
                    $size: "$likes",
                },
            },
        },
    ]);

    if (!videos) {
        throw new ApiError(500, "something want wrong while get all videos");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "get all videos successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async(req, res) =>{
    const {videoId} = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");    
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;

    await video.save();

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Publish status toggled successfully. New status: ${
          video.isPublished ? "Published" : "Unpublished"
        }`,
        video
      )
    );
})

export {
    publishVideo,
    getVideoById,
    getAllVideos,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}