import { json } from "express";
import Notification from "../models/notificatios.model.js";
import User from "../models/user.model.js";
import { S3Client } from "@aws-sdk/client-s3";

import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "Your can't follow/unfollow yourself" });
    }

    if (!userToModify || !currentUser) {
      return res.status(400).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // unfollwo the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } }); //TODO return the id of the user as a response
      //TODO return the id of the user as a response
      res.status(200).json({ message: "User unfollowed successfull" });
    } else {
      //follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      //send notification

      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });
      await newNotification.save();
      //TODO return the id of the user as a response
      res.status(200).json({ message: "User followed successfull" });
    }
  } catch (error) {
    console.log("Error in getUserProfile: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getsuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const userFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !userFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in suggested users controller: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { fullname, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        error: "Please enter both current passsowrd and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Current password is incorect" });
      if (newPassword.length < 6) {
        return (
          res.status(400),
          json({ error: "Password must be at least 6 characters long" })
        );
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      const profileImgParams = {
        Bucket: "x-clone-user-images",
        Key: `profile/${user._id}-profile.jpg`,
        Body: Buffer.from(profileImg, "base64"),
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      const profileImgUpload = await S3Client.send(
        new PutObjectCommand(profileImgParams)
      );
      user.profileImg = `https://${profileImgParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${profileImgParams.Key}`;
      console.log("profile image uploaded", user.profileImg);
    }

    if (coverImg) {
      const coverImgParams = {
        Bucket: "x-clone-user-images",
        Key: `cover/${user._id}-cover.jpg`,
        Body: Buffer.from(coverImg, "base64"),
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
      };

      const coverImgUpload = await S3Client.send(
        new PutObjectCommand(coverImgParams)
      );
      user.coverImg = `https://${coverImgParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${coverImgParams.Key}`;
    }
    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
