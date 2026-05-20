const router = require('express').Router();
const path = require('path');

const emojis = require(path.join(__dirname, '..', 'data', 'emojis.json'));
const stickers = require(path.join(__dirname, '..', 'data', 'stickers.json'));

// GET /api/v1/assets/emojis
router.get('/emojis', (req, res) => {
    // #swagger.tags = ['Assets']
    // #swagger.summary = 'Get available emoji list'
    /* #swagger.responses[200] = { description: 'Array of Unicode emoji characters' } */
    res.json(emojis);
});

// GET /api/v1/assets/stickers
router.get('/stickers', (req, res) => {
    // #swagger.tags = ['Assets']
    // #swagger.summary = 'Get available sticker list'
    /* #swagger.responses[200] = { description: 'Array of sticker objects with id, label, emoji' } */
    res.json(stickers);
});

module.exports = router;
