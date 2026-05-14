const bcrypt = require('bcrypt');
const db = require('../models/index.js');
const util = require('../util.js');

async function parentAuth(email, pwd) {
    const p = await db.parents.findOne({ where: { email } });
    if (!p || !p.dataValues.id) {
        return { esito: 1 };
    }
    const match = await bcrypt.compare(pwd, p.dataValues.pwd);
    return match ? { esito: 0, userid: p.dataValues.id } : { esito: 1 };
}

async function userAuth(usertoken) {
    const userid = util.atob(usertoken[0]);
    const deviceId = util.atob(usertoken[1]).trim();
    const encrDevice = usertoken[2].replace(/ /g, '+');

    const u = await db.users.findByPk(userid);
    if (!u) {
        return { errCode: 3, errDesc: "User unknown" };
    }

    let decryptDeviceId;
    try {
        decryptDeviceId = util.pubDecode(encrDevice, u.key).replace('\n', '');
    } catch (e) {
        return { errCode: 6, errDesc: "Token not valid" };
    }

    if (decryptDeviceId != deviceId) {
        return { errCode: 6, errDesc: "Token not valid" };
    }

    const d = await db.devices.findOne({ where: { userid } });
    if (!d) {
        return { errCode: 7, errDesc: "User don't have DeviceId registered" };
    }
    if (d.id != deviceId) {
        return { errCode: 8, errDesc: "Other DeviceID associated with user" };
    }

    return { errCode: 0, jwt: { user: userid, nick: u.nick, profile: 'User' } };
}

module.exports = { parentAuth, userAuth };
