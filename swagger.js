const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        version: '0.10.0',
        title: 'SiSMoChat API',
        description: 'API for SiSMoChat - A secure chat application focused on child safety with parental control.'
    },
    host: 'localhost:3000',
    basePath: '/api/v1',
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
        { name: 'Devices', description: 'Device pairing management' },
        { name: 'Assets', description: 'Static assets (stickers, emojis)' },
        { name: 'Sync', description: 'Client state synchronization' },
        { name: 'Status', description: 'Server status' }
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

// Mount map mirrors app.js: v1.use('/mount/', require('./routes/file.js'))
const mounts = [
    { prefix: '/auth', file: './routes/auth.js' },
    { prefix: '/parent', file: './routes/parent.js' },
    { prefix: '/user', file: './routes/user.js' },
    { prefix: '/message', file: './routes/message.js' },
    { prefix: '/connection', file: './routes/connection.js' },
    { prefix: '/device', file: './routes/device.js' },
    { prefix: '/assets', file: './routes/assets.js' },
    { prefix: '/sync', file: './routes/sync.js' },
    { prefix: '/status', file: './routes/status.js' }
];

const endpointsFiles = mounts.map(m => m.file);

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    const fs = require('fs');
    const output = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

    // Build lookup: for each route file, extract its defined paths with HTTP method
    const filePaths = {};
    for (const { prefix, file } of mounts) {
        const content = fs.readFileSync(file, 'utf-8');
        const regex = /router\.\s*(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        filePaths[file] = [];
        while ((match = regex.exec(content)) !== null) {
            filePaths[file].push({
                method: match[1],
                routePath: match[2],
                swaggerPath: match[2].replace(/:(\w+)/g, '{$1}'),
                prefix
            });
        }
    }

    // Rebuild paths object with prefixes, copying only the specific HTTP verb
    const newPaths = {};
    for (const { file } of mounts) {
        for (const { method, swaggerPath, prefix } of filePaths[file]) {
            const newKey = prefix + swaggerPath;
            const operation = output.paths[swaggerPath]?.[method];
            if (!operation) continue;
            if (!newPaths[newKey]) newPaths[newKey] = {};
            newPaths[newKey][method] = operation;
        }
    }

    // Keep any paths that already have a prefix (shouldn't happen) or special ones
    for (const [key, value] of Object.entries(output.paths)) {
        const alreadyMapped = mounts.some(m =>
            filePaths[m.file].some(fp => fp.swaggerPath === key)
        );
        if (!alreadyMapped) {
            newPaths[key] = value;
        }
    }

    output.paths = newPaths;
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log('Post-processed: mount prefixes applied to', Object.keys(newPaths).length, 'paths');
});
