let util = {

    PARENT_USER_NICK: '__parent__',

    // MESSAGE STATUS
    MessageStatus : {
        UNREAD: 0,
        DOWNLOADED: 1
    },

    // CONNECTION STATUS
    ConnectionStatus : {
    ACCEPTED: 0,
    REQUESTED: 1,
    REJECTED: 2
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
        const encrypted = require('crypto').privateEncrypt({ key: key, passphrase: '' }, Buffer.from(msg));
        return encrypted.toString("base64");
    },

    privDecode: function (msg, key, done) {
        let res = require('crypto').privateDecrypt(key, Buffer.from(msg, 'base64'));
        done(res);
    },

    userExists: function (userid) {
        return require('./models/index.js').users.findByPk(userid).then(u => {
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