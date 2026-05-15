const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const util = require('../util.js');
const db = require('../models/index.js');

const SALT_ROUNDS = 10;

router.post('/', [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
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
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input", details: errors.array() });
    }
    try {
        const found = await util.parentEmailExists(req.body.email);
        if (!found) {
            const hash = await bcrypt.hash(req.body.pwd, SALT_ROUNDS);
            const parent = await db.parents.create({ email: req.body.email, pwd: hash });
            res.status(201).json({ ID: parent.id });
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
        return res.status(400).json({ errCode: 4, errDesc: "Invalid input", details: errors.array() });
    }
    const parent = await db.parents.findByPk(req.user.user);
    if (!parent) {
        return res.status(404).send({ errCode: 3, errDesc: "Parent not found" });
    }
    const match = await bcrypt.compare(req.body.oldPassword, parent.pwd);
    if (!match) {
        return res.status(401).send({ errCode: 4, errDesc: "Old password incorrect" });
    }
    const hash = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
    await parent.update({ pwd: hash });
    res.sendStatus(204);
});

router.get('/:email', authenticate, [
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

module.exports = router;
