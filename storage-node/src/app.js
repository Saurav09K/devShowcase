const express = require('express');
const config = require('./config/storage');
const chunkRoutes = require('./routes/chunk.routes');

const app = express();

app.use(express.json());


app.use('/chunks', chunkRoutes);

module.exports = app;