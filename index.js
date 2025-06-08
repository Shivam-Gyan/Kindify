import express from 'express';
import dotenv from 'dotenv';
import db from './config/mongoose.database.js'
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});