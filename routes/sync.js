const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { generateStateCert } = require('../services/stateCert');

// GET /api/v1/sync/cert — get current state certificate on demand
router.get('/cert', authenticate, authorize('Parent'), async (req, res) => {
    // #swagger.tags = ['Sync']
    // #swagger.summary = 'Get current state certificate'
    // #swagger.security = [{ "Bearer": [] }]
    /* #swagger.responses[200] = { description: 'State certificate JWT' } */
    const stateCert = await generateStateCert(req.user.user);
    if (!stateCert) return res.status(404).json({ errCode: 3, errDesc: 'Parent not found' });
    res.json({ stateCert });
});

module.exports = router;
