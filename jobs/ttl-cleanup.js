const { Op } = require('sequelize');
const db = require('../models/index.js');

const TTL_DAYS = parseInt(process.env.MSG_TTL_DAYS || '30', 10);
const CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000; // Run twice a day

async function purgeExpiredMessages() {
    const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await db.messages.destroy({
        where: { createdAt: { [Op.lt]: cutoff } }
    });
    if (deleted > 0) {
        console.log(`TTL cleanup: removed ${deleted} expired message(s)`);
    }
}

function startCleanupJob() {
    // Run once at startup
    purgeExpiredMessages();
    // Then periodically
    setInterval(purgeExpiredMessages, CLEANUP_INTERVAL_MS);
}

module.exports = { startCleanupJob, purgeExpiredMessages };
