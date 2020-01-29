require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const cors = require('cors');

const router = require('./route');
const db = require('./drivers/mongodb');

db.on('error', console.error.bind(console, 'connection error:'));

const app = express();
app.use(morgan('combined'));
app.use(bodyParser.json({ type: '*/*' }));
app.use(cors());

const server = http.createServer(app);

router(app);

server.listen(process.env.PORT);

console.log('Server running on ', process.env.PORT);
