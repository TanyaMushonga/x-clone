import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    if (img) {
      const ImgParams = {
        Bucket: "x-clone-user-images",
        Key: `posts/${user._id}-.jpg`,
        Body: Buffer.from(img, "base64"),
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      await S3Client.send(new PutObjectCommand(ImgParams));
      user.Img = `https://${ImgParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${ImgParams.Key}`;
    }
    const newPost = new Post({
      user: userId,
      text,
      img,
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
