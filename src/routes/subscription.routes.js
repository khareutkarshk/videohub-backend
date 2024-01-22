import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJwt);

router.route("/c/:subscriberId").get(getSubscribedChannels);

router.route("/u/:channelId").get(getUserChannelSubscribers).post(toggleSubscription);

export default router;