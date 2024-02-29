import mongoose, {Mongoose, isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


const createPlaylist = asyncHandler(async(req, res) =>{
    const {name, description} = req.body;

    if([name, description].some((field) => field?.trim() === "")){
        throw new ApiError(401, `${field} is required`);
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async(req, res) =>{
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.find({
        owner: new mongoose.Types.ObjectId(userId)
    })


    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists retrieved successfully"))
})

const getPlaylistById = asyncHandler(async(req, res) =>{
    const {playlistId} = req.params;
    if(!playlistId){
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)

    console.log("playlist: ",playlist);

    return res
        .status(200)
        .json(new ApiResponse(200, {playlist}, "Playlist retrieved successfully"))
})

const addVideoToPlaylist = asyncHandler(async(req, res) =>{

    const {playlistId, videoId} = req.params;

    if(!playlistId && !videoId){
        throw new ApiError(400, "Invalid playlist or videoId id");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async(req, res) =>{
    const {playlistId, videoId} = req.params;

    if(!playlistId && !videoId){
        throw new ApiError(400, "Invalid playlist or videoId id");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    
    )

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async(req, res) =>{
    const {playlistId} = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletedPlaylist){
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async(req, res) =>{
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if([name, description].some((field) => field?.trim() === "")){
        throw new ApiError(401, `${field} is required`);
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}