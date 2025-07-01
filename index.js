import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import db from './config/mongoose.database.js'
import { globalLimiter } from './middlewares/rate.limiter.middleware.js';
import fileUpload from 'express-fileupload'

// Importing user routes
import userRouter from './routes/user.route.js';
import DonorRouter from './routes/donor.route.js';
import ContactAndQueryRouter from './routes/contactAndQuery.route.js';
import NgoRouter from './routes/ngo.route.js';

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: [process.env.FRONTEND_URI], // Allow both localhost and IP
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


app.use(fileUpload({
    useTempFiles:true,
}))

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));


// limiting the number of request globally
app.use(globalLimiter); 

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Using user routes
app.use('/api/user', userRouter);
app.use('/api/donor', DonorRouter); 
app.use('/api/contact',ContactAndQueryRouter)
app.use('/api/ngo', NgoRouter);

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