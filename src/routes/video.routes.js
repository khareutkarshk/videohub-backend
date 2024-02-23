import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus,
    updateVideo,
    publishVideo
} from "../controllers/video.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

// Get all videos
router.route("/getAllVideos").get(getAllVideos);

// Publish a video
router.route("/publish")
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router