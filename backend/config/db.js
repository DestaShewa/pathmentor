const mongoose = require("mongoose");

const connectDB = async () => {
  const atlasURI = process.env.MONGO_URI;
  const localURI = process.env.MONGO_URI_LOCAL || "mongodb://localhost:27017/pathmentor";

  // Try Atlas first, fall back to local
  const uris = [atlasURI, localURI].filter(Boolean);

  for (const uri of uris) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1");
      console.log(`MongoDB Connected: ${isLocal ? "Local" : "Atlas"}`);
      return;
    } catch (err) {
      console.warn(`MongoDB connection failed (${uri.includes("localhost") ? "local" : "Atlas"}): ${err.message}`);
    }
  }

  console.error("All MongoDB connections failed. Exiting.");
  process.exit(1);
};

module.exports = connectDB;
