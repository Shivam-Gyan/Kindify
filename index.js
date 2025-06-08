import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import db from './config/mongoose.database.js'

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


// Middleware to parse JSON bodies
app.use(express.json());
// Importing user routes
import userRouter from './routes/user.route.js';
// Using user routes
app.use('/api/user', userRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});