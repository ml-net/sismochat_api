const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        version: '0.1.0',
        title: 'SiSMoChat API',
        description: 'API for SiSMoChat - A secure chat application focused on child safety with parental control.'
    },
    host: 'localhost:3000',
    basePath: '/',
    schemes: ['http'],
    securityDefinitions: {
        Bearer: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'JWT token. Format: "Bearer {token}"'
        }
    },
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Parents', description: 'Parent account management' },
        { name: 'Users', description: 'Child user management' },
        { name: 'Messages', description: 'Messaging endpoints' },
        { name: 'Connections', description: 'Connection/friendship management' },
        { name: 'Devices', description: 'Device pairing management' }
    ],
    definitions: {
        Parent: {
            email: 'parent@example.com',
            pwd: 'securepassword'
        },
        User: {
            nick: 'childnick',
            pk: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
        },
        Message: {
            to: '550e8400-e29b-41d4-a716-446655440000',
            message: 'encrypted message content'
        },
        ConnectionStatus: {
            status: 0
        }
    }
};

const outputFile = './swagger_output.json';
const endpointsFiles = [
    './routes/auth.js',
    './routes/parent.js',
    './routes/user.js',
    './routes/message.js',
    './routes/connection.js',
    './routes/device.js'
];

swaggerAutogen(outputFile, endpointsFiles, doc);
