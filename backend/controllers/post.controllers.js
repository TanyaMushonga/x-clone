import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notificatios.model.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../server.js";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const img = req.file; // Assuming multer is used to handle file uploads
    const userId = req.user.id; // Assuming user ID is available in req.user

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    let imgUrl = null;
    if (img) {
      const ImgParams = {
        Bucket: "x-clone-user-images",
        Key: `posts/${userId}-${Date.now()}.jpg`,
        Body: img.buffer,
        ContentType: img.mimetype,
      };

      await s3Client.send(new PutObjectCommand(ImgParams));
      imgUrl = `https://${ImgParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${ImgParams.Key}`;
    }

    const newPost = new Post({
      user: userId,
      text,
      img: imgUrl,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
    console.log(error);
  }
};
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorised to delete this post" });
    }

    if (post.img) {
      const ImgParams = {
        Bucket: "x-clone-user-images",
        Key: `posts/${user._id}-.jpg`,
        Body: Buffer.from(img, "base64"),
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      // Delete the image
      const deleteParams = {
        Bucket: ImgParams.Bucket,
        Key: ImgParams.Key,
      };

      await S3Client.send(new DeleteObjectCommand(deleteParams));
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfull" });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
    console.log(error);
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const comment = { user: userId, text };
    post.comments.push(comment);

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in commentsOnPost controller: ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

export const LikeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // unlike the post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      //like a post
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();
      const notifications = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notifications.save();
      res.status(200).json({ message: "Post like successfully" });
    }
  } catch (error) {
    console.log("Error in like unlike controller: ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in get all posts controller: ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

export const getLikedPost = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    console.log("user", user);
    if (!user) return res.status(404).json({ error: "User not found" });

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in get liked post controller: ", error);
    res.status(500).json({ error: "internal server error" });
  }
};
