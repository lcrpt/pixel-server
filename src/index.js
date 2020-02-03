require('dotenv').load();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const cors = require('cors');

const router = require('./route');

const app = express();
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const server = http.createServer(app);

router(app);

server.listen(process.env.PORT);

console.log('Server running on ', process.env.PORT);
