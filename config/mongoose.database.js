import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kindify';

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('Successfully connected to MongoDB');
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const db = mongoose.connection;


export default db;