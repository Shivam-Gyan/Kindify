import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import db from './config/mongoose.database.js'
import { globalLimiter } from './middlewares/rate.limiter.middleware.js';
import cors from 'cors'
import fileUpload from 'express-fileupload'

// Importing user routes
import userRouter from './routes/user.route.js';
import DonorRouter from './routes/donor.route.js';

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use(cors(
    {
        origin: process.env.FRONTEND_URI, 
        allowedHeaders: ['Content-Type', 'Authorization'],
    }
));


app.use(fileUpload({
    useTempFiles:true,
}))


// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// limiting the number of request globally
app.use(globalLimiter); 


// Using user routes
app.use('/api/user', userRouter);
app.use('/api/donor', DonorRouter); 


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});