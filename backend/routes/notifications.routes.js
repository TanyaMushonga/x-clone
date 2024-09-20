import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  deleteNotifications,
  getNotifcications,
} from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifcications);
router.delete("/", protectRoute, deleteNotifications);

export default router;
