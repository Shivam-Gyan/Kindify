import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import db from './config/mongoose.database.js'
import { globalLimiter } from './middlewares/rate.limiter.middleware.js';

// Importing user routes
import userRouter from './routes/user.route.js';

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow both localhost and IP
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Middleware to parse JSON bodies
app.use(express.json());

// limiting the number of request globally
app.use(globalLimiter); 

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Using user routes
app.use('/api/user', userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found'
    });
});

// Start server only after database connection is established
db.once('open', () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
});

// Handle database connection errors
db.on('error', (err) => {
    console.error('Database connection error:', err);
    process.exit(1);
});