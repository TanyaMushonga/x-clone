import express from "express";
import multer from "multer";

import { protectRoute } from "../middleware/protectRoute.js";
import {
  followUnfollowUser,
  getsuggestedUsers,
  getUserProfile,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage,  limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getsuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post(
  "/update",
  protectRoute,
  upload.fields([
    { name: "profileImg", maxCount: 1 },
    { name: "coverImg", maxCount: 1 },
  ]),
  updateProfile
);

export default router;
