const bcrypt = require('bcrypt');
const db = require('../models/index.js');
const util = require('../util.js');

async function parentAuth(email, pwd) {
    const p = await db.parents.findOne({ where: { email } });
    if (!p || !p.dataValues.id) {
        return { esito: 2 }; // not found
    }
    const match = await bcrypt.compare(pwd, p.dataValues.pwd);
    return match ? { esito: 0, userid: p.dataValues.id } : { esito: 1 }; // 1 = wrong password
}

async function userAuth(usertoken) {
    const userid = util.atob(usertoken[0]);
    const deviceId = util.atob(usertoken[1]).trim();
    const signature = usertoken[2].replace(/ /g, '+');

    const u = await db.users.findByPk(userid);
    if (!u) {
        return { errCode: 3, errDesc: "User unknown" };
    }

    let verified;
    try {
        verified = require('crypto').verify(
            'sha256',
            Buffer.from(deviceId),
            { key: u.key, padding: require('crypto').constants.RSA_PKCS1_PADDING },
            Buffer.from(signature, 'base64')
        );
    } catch (e) {
        return { errCode: 6, errDesc: "Token not valid" };
    }

    if (!verified) {
        return { errCode: 6, errDesc: "Token not valid" };
    }

    const d = await db.devices.findOne({ where: { userid } });
    if (!d) {
        return { errCode: 14, errDesc: "User don't have DeviceId registered" };
    }
    if (d.id != deviceId) {
        return { errCode: 8, errDesc: "Other DeviceID associated with user" };
    }

    return { errCode: 0, jwt: { user: userid, nick: u.nick, profile: 'User' } };
}

module.exports = { parentAuth, userAuth };
