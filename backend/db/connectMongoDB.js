import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Mongo db connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connect to mongo DB: ${error.message}`);
    process.exit(1);
  }
};

export default connectMongoDB;
