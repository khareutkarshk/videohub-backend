import { Router } from "express";
import { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike, getDislikedVideos} 
from "../controllers/dislike.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoDislike);
router.route("/toggle/c/:commentId").post(toggleCommentDislike);
router.route("/toggle/t/:tweetId").post(toggleTweetDislike);
router.route("/videos").get(getDislikedVideos);

export default router