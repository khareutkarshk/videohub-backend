import { Router } from "express";

import {
    addCommentToVideo,
    updateComment,
    deleteComment,
    getVideoComments,
    replyToComment
} from "../controllers/comment.controller.js";

import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/:videoId").get(getVideoComments).post(addCommentToVideo);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment).post(replyToComment);

export default router;