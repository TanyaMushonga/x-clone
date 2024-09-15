import express from "express";
import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectMongoDB from "./db/connectMongoDB.js";
import postRoutes from "./routes/post.routes.js";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.listen(PORT, () => {
  console.log("Server is running on PORT: ", PORT);
  connectMongoDB();
});

export { s3Client };
