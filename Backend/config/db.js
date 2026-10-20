const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blogksolve';

    // If user provided an Atlas URI and replaced the password, use it
    if (process.env.ATLAS_MONGO_URI && !process.env.ATLAS_MONGO_URI.includes('<db_password>')) {
      uri = process.env.ATLAS_MONGO_URI;
      console.log('Connecting using MongoDB Atlas Cluster...');
    } else {
      console.log('Connecting using Local MongoDB (127.0.0.1:27017)...');
    }

    const conn = await mongoose.connect(uri);
    console.log(` MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
