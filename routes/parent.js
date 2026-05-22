const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');
const { sendResetOtp } = require('../services/email.js');
const rateLimit = require('express-rate-limit');

const SALT_ROUNDS = 10;
const PARENT_USER_NICK = util.PARENT_USER_NICK;
const RESET_TTL_MINUTES = parseInt(process.env.RESET_TOKEN_TTL_MINUTES) || 30;
const RESET_MAX_ATTEMPTS = 5;

const RESET_RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RESET_RATE_LIMIT_WINDOW_MINUTES) || 15;
const DISCOVERY_RATE_LIMIT_PER_HOUR = parseInt(process.env.DISCOVERY_RATE_LIMIT_PER_HOUR) || 10;

const resetRequestLimiter = rateLimit({
    windowMs: RESET_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: 3,
    keyGenerator: (req) => req.body.email || req.ip,
    message: { errCode: 15, errDesc: 'Too many reset requests, try again later' },
    validate: false
});

const discoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: DISCOVERY_RATE_LIMIT_PER_HOUR,
    keyGenerator: (req) => req.user?.user || req.ip,
    message: { errCode: 15, errDesc: 'Too many search requests, try again later' },
    validate: false
});

router.post('/', [
    body('email').isEmail().withMessage('Valid email required').trim(),
    body('pwd').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Register a new parent'
    // #swagger.description = 'Create a new parent account with email and password (min 6 chars).'
    /* #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Parent' }
    } */
    /* #swagger.responses[201] = { description: 'Parent created, returns ID' } */
    /* #swagger.responses[400] = { description: 'Email already exists or invalid input' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: errors.array().map(e => e.msg).join(', '), details: errors.array() });
    }
    try {
        const found = await util.parentEmailExists(req.body.email);
        if (!found) {
            const hash = await bcrypt.hash(req.body.pwd, SALT_ROUNDS);
            const parent = await db.parents.create({ email: req.body.email, pwd: hash });

            // Create virtual user for parent-to-child messaging
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: '' }
            });
            const virtualUser = await db.users.create({ nick: PARENT_USER_NICK, key: publicKey, parent: parent.id });
            const device = await db.devices.create({ userid: virtualUser.id });

            const { generateStateCert } = require('../services/stateCert');
            const stateCert = await generateStateCert(parent.id);

            res.status(201).json({
                ID: parent.id,
                virtualUser: { id: virtualUser.id, deviceId: device.id, keys: { public: publicKey, private: privateKey } },
                stateCert
            });
        } else {
            res.status(400).send({ errCode: 2, errDesc: "Exists an User with this email" });
        }
    } catch (err) {
        res.status(500).send({ errCode: -1, errDesc: "Internal error" });
    }
});

router.patch('/password', authenticate, [
    body('oldPassword').notEmpty(),
    body('newPassword').notEmpty().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Change parent password'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[204] = { description: 'Password changed' } */
    /* #swagger.responses[400] = { description: 'Invalid input' } */
    /* #swagger.responses[401] = { description: 'Old password incorrect' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: errors.array().map(e => e.msg).join(', '), details: errors.array() });
    }
    const parent = await db.parents.findByPk(req.user.user);
    if (!parent) {
        return res.status(404).send({ errCode: 3, errDesc: "Parent not found" });
    }
    const match = await bcrypt.compare(req.body.oldPassword, parent.pwd);
    if (!match) {
        return res.status(401).send({ errCode: 12, errDesc: "Old password incorrect" });
    }
    if (req.body.oldPassword === req.body.newPassword) {
        return res.status(400).send({ errCode: 4, errDesc: "New password must differ from old password" });
    }
    const hash = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
    await parent.update({ pwd: hash });
    const { generateStateCert } = require('../services/stateCert');
    const stateCert = await generateStateCert(req.user.user);
    res.status(200).json({ stateCert });
});

router.get('/me/connections/sent', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Get sent connection requests'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of sent requests with status' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(404).send("Parent not found");
    }
    const children = await util.getUserByParent(req.user.user);
    const fromList = children.map(u => u.id);
    const requests = await db.connections.findAll({ where: { from: fromList } });
    res.status(200).send(requests.map(r => ({ id: r.id, from: r.from, to: r.to, status: r.status })));
});

router.get('/me/connections/pending', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Get pending connection requests for approval'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of pending connection requests' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    if (!await util.parentExists(req.user.user)) {
        return res.status(404).send("Parent not found");
    }
    const list = await util.getUserByParent(req.user.user);
    const toList = list.map(u => u.id);
    const cList = await db.connections.findAll({ where: { status: util.ConnectionStatus.REQUESTED, to: toList } });
    res.status(200).send(cList.map(c => c.dataValues));
});

router.get('/:email/children', authenticate, authorize('Parent'), discoveryLimiter, [
    param('email').isEmail()
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Get children of a parent by email'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'List of children (nick only)' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }
    const p = await db.parents.findOne({ where: { email: req.params.email } });
    if (p) {
        const list = await util.getUserByParent(p.id);
        res.status(200).send(list.filter(u => u.nick !== PARENT_USER_NICK));
    } else {
        res.status(404).send('No parent found');
    }
});

router.get('/:email', authenticate, discoveryLimiter, [
    param('email').isEmail()
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Get parent by email'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'Parent found' } */
    /* #swagger.responses[401] = { description: 'Authentication required' } */
    /* #swagger.responses[404] = { description: 'Parent not found' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }
    const u = await db.parents.findOne({ where: { email: req.params.email } });
    if (u) {
        res.status(200).send({ parentID: u.id, email: u.email });
    } else {
        res.status(404).send('No parent found');
    }
});

router.post('/reset-request', resetRequestLimiter, [
    body('email').isEmail().trim()
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Request password reset OTP'
    // #swagger.description = 'Sends a 6-digit OTP to the parent email. Does not reveal if email exists.'
    /* #swagger.responses[200] = { description: 'Reset email sent (if account exists)' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }

    const parent = await db.parents.findOne({ where: { email: req.body.email } });
    if (parent) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hash = crypto.createHash('sha256').update(otp).digest('hex');
        const expiry = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
        await parent.update({ resetOtp: hash, resetOtpExpiry: expiry, resetOtpAttempts: 0 });
        await sendResetOtp(req.body.email, otp);
    }

    res.status(200).json({
        msg: 'If the email exists, a reset code has been sent',
        note: 'Check your spam folder — the email comes from onboarding@resend.dev'
    });
});

router.post('/reset', [
    body('email').isEmail().trim(),
    body('otp').isString().isLength({ min: 6, max: 6 }),
    body('newPassword').notEmpty().isLength({ min: 6 })
], async (req, res) => {
    // #swagger.tags = ['Parents']
    // #swagger.summary = 'Reset password with OTP'
    // #swagger.description = 'Validates the 6-digit OTP and sets a new password. Max 5 attempts.'
    /* #swagger.responses[204] = { description: 'Password reset successful' } */
    /* #swagger.responses[400] = { description: 'Invalid or expired OTP' } */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input" });
    }

    const parent = await db.parents.findOne({ where: { email: req.body.email } });
    if (!parent || !parent.resetOtp || !parent.resetOtpExpiry) {
        return res.status(400).json({ errCode: 5, errDesc: 'Invalid or expired reset code' });
    }

    if (new Date() > new Date(parent.resetOtpExpiry)) {
        await parent.update({ resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
        return res.status(400).json({ errCode: 5, errDesc: 'Reset code expired' });
    }

    if (parent.resetOtpAttempts >= RESET_MAX_ATTEMPTS) {
        await parent.update({ resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
        return res.status(400).json({ errCode: 5, errDesc: 'Too many attempts, request a new code' });
    }

    const hash = crypto.createHash('sha256').update(req.body.otp).digest('hex');
    if (hash !== parent.resetOtp) {
        const newAttempts = parent.resetOtpAttempts + 1;
        await parent.update({ resetOtpAttempts: newAttempts });
        const remaining = RESET_MAX_ATTEMPTS - newAttempts;
        return res.status(400).json({ errCode: 5, errDesc: `Invalid code. ${remaining} attempts remaining` });
    }

    const newHash = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
    await parent.update({ pwd: newHash, resetOtp: null, resetOtpExpiry: null, resetOtpAttempts: 0 });
    res.sendStatus(204);
});

module.exports = router;
