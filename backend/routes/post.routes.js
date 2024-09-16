import express from "express";
import multer from "multer";

import { protectRoute } from "../middleware/protectRoute.js";
import {
  commentOnPost,
  createPost,
  deletePost,
  getAllPosts,
  LikeUnlikePost,
} from "../controllers/post.controllers.js";

const router = express.Router();

const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

router.get("/all", protectRoute, getAllPosts);
router.post("/create", protectRoute, upload.single("img"), createPost);
router.post("/like/:id", protectRoute, LikeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
