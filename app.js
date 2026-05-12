const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
var db = require('./models/index.js');
const jwt = require('jsonwebtoken');
const util = require('./util.js');
const cred = require('./APIcred.js');
const {Op} = require("sequelize");
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

// Security headers
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 attempts per window
    message: { errCode: -1, errDesc: 'Too many attempts, try again later' }
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Routing rules
// Authentication (rate limited)
app.use('/api/auth/', authLimiter, require('./routes/auth.js'));

// Parents' management endpoint
app.use('/api/super/', require('./routes/parent.js'));

// Users' management endpoint
app.use('/api/user/', require('./routes/user.js'));

// Messages' endpoint
app.use('/api/message/', require('./routes/message.js'));

// Connections' management endpoint
app.use('/api/connection/', require('./routes/connection.js'));

// Devices' managemente Endpoint
app.use('/api/device/', require('./routes/device.js'));

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

module.exports = app;