const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

// API v1 router
const v1 = express.Router();
v1.use('/auth/', authLimiter, require('./routes/auth.js'));
v1.use('/parent/', require('./routes/parent.js'));
v1.use('/user/', require('./routes/user.js'));
v1.use('/message/', require('./routes/message.js'));
v1.use('/connection/', require('./routes/connection.js'));
v1.use('/device/', require('./routes/device.js'));
v1.use('/assets/', require('./routes/assets.js'));
v1.use('/sync/', require('./routes/sync.js'));
v1.use('/status/', require('./routes/status.js'));

app.use('/api/v1', v1);

app.get('/health', async (_req, res) => {
    try {
        await require('./models').sequelize.authenticate();
        res.status(200).json({ status: 'ok', version: require('./package.json').version });
    } catch (_err) {
        res.status(503).json({ status: 'error', detail: 'database unreachable' });
    }
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Global error handler
app.use((err, req, res, _next) => {
    console.error(err.stack || err);
    res.status(err.status || 500).json({
        errCode: -1,
        errDesc: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

module.exports = app;