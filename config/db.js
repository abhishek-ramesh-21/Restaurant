const mongoose = require('mongoose');

// In-memory fallback data store if MongoDB service is unavailable
const mockDatabase = {
  menuItems: [],
  reservations: [],
  orders: []
};

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_restaurant';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${mongoURI}`);
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB Notice] Local MongoDB server not detected at ${mongoURI}.`);
    console.warn(`[MongoDB Fallback] Operating in Dynamic Memory Mode for immediate execution & testing.`);
  }
};

const getStatus = () => ({
  isConnected,
  mockDatabase
});

module.exports = {
  connectDB,
  getStatus,
  mockDatabase
};
