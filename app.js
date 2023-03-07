const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var db = require('./models/index.js');
const jwt = require('jsonwebtoken');
const util = require('./util.js');
const cred = require('./APIcred.js');
const {Op} = require("sequelize");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Routing rules
// Autenthication
app.use('/api/auth/', require('./routes/auth.js'));

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

module.exports = app;