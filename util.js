let util = {

    // MESSAGE STATUS
    MESS : {
        UNREAD: 0,
        READ: 1
    },

    pubEncode: function (msg, key) {
        let res = require('crypto').publicEncrypt(key, Buffer.from(msg, 'base64')).toString('base64');
        return res;
    },

    pubDecode: function (msg, key) {
        let res = require('crypto').publicDecrypt(key, Buffer.from(msg, 'base64')).toString();
        return res;
    },

    privEncode: function (msg, key) {
        let hash = require('crypto').createHash('md5').update(msg).digest('hex');
        require('fs').writeFileSync(hash, key);
        const privateKey = require('fs').readFileSync(hash, "utf8");
        const encrypted = require('crypto').privateEncrypt({ key: privateKey, passphrase: '' }, Buffer.from(msg));
        let res = encrypted.toString("base64");
        require('fs').unlinkSync(hash);
        return res;
    },

    privDecode: function (msg, key, done) {
        let res = require('crypto').privateDecrypt(key, Buffer.from(msg, 'base64'));
        done(res);
    },

    userExists: function (userid) {
        const models = require('./models/index.js');
        models.users.findByPk(userid).then(u => {
            return (u !== null);
        });
    },

    parentExists: function (userid) {
        return require('./models/index.js').parents.findByPk(userid).then(u => {
            return (u !== null);
        });
    },

    parentEmailExists: function (email) {
        return require('./models/index.js').parents.findOne({ where: { email: email } }).then(u => {
            return (u !== null);
        });
    },

    getUserByParent: function (parent) {
        return require('./models/index.js').users.findAll({ where: { parent: parent } }).then(u => {
            let list = [];
            for (const element of u) {
                let tmp = {
                    id: element.dataValues.id,
                    nick: element.dataValues.nick
                }
                list.push(tmp);
            }
            return list;
        });
    },

    getNickByID: function (userid) {
        return require('./models/index.js').users.findByPk(userid).then(u => {
            if (u !== null) {
                return u.nick;
            } else {
                return 'N/D';
            }
        });

    },

    btoa: function (plain) {
        return Buffer.from(plain, 'binary').toString('base64');
    },

    atob: function (b64) {
        return Buffer.from(b64, 'base64').toString();
    }
}

module.exports = util;