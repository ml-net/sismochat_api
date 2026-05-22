const router = require('express').Router();

router.get('/', (_req, res) => {
    // #swagger.tags = ['Status']
    // #swagger.summary = 'Get server status message'
    // #swagger.description = 'Returns an optional message for client display at startup (e.g. maintenance notices).'
    /* #swagger.responses[200] = { description: 'Status message (null if none)' } */
    res.json({ message: process.env.STATUS_MESSAGE || null });
});

module.exports = router;
