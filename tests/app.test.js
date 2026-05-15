const request = require('supertest');
const app = require('../app');
const util = require('../util.js');
const newParent = {
    email: 'me@me.com',
    pwd: "blablabla",
}

const testMsg = 'The quick brown fox jumps over the lazy dog!';

const newUserWithoutKey = {
    nick: 'mynick1'
}

const newUserWithoutKey2 = {
    nick: 'mynick1'
}

const newUserWithKey = {
    nick: 'mynick2',
    pk: '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7rE907tEU0tBkxsC44Dy\n' +
        '6wsmoMwRs0k8NHkU6tDr6Oje1NYHEQe0YLN22OXnqYZmpzwkbH9cgkcufjalSRX7\n' +
        'odCqLM14UrBJenqZ03iXq0Kqhf2h3L6C6VpOlaqqnN1BibTTA3aI5W0VnDgAQxPB\n' +
        'WSbfJN543tj6rBgsMzJyJMPvNREVaBvkdeUVb3qBJVw6quoLJ7mTwZE+6fuoYHl5\n' +
        'pBVmT9ixHWhXM8UnV2eBg8/z2ogpvZq2amgiapV3WsHH5OXOP9TO3zg73FstlhRE\n' +
        'VaFnhx+YqbVFcUnYn9/8YvtsFJcXw2rdiNRbE2h2Iy39MA9GJEH8MEHHKrOXqOot\n' +
        '1QIDAQAB\n' +
        '-----END PUBLIC KEY-----\n'
}

let JWTtokenParent, JWTTokenUser, JWTTokenUser2;
let pk1, pv1, pk2, pv2;
let id1, id2;
let deviceId1, deviceId2;
let msgId, connId;

describe('Parent endpoint', () => {

    it('Create a new parent should return 201', () => {
        return (
            request(app)
                .post('/api/v1/super')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                })
        );
    });

    it('Create a parent with existing email should return 400', () => {
        return (
            request(app)
                .post('/api/v1/super')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(400)
        );
    });

    it('GET parent without auth should return 401', () => {
        return (
            request(app)
                .get('/api/v1/super/' + newParent.email)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Doing parent auth should return 200 and JWT token', () => {
        return (
            request(app)
                .post('/api/v1/auth/parent')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTtokenParent = authResponse.body.token;
                })
        );
    });

    it('Trying auth with missing credentials should return 401', () => {
        return (
            request(app)
                .post('/api/v1/auth/parent')
                .send({
                    email: 'me@me.com'
                })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Trying auth with invalid credentials should return 401', () => {
        return (
            request(app)
                .post('/api/v1/auth/parent')
                .send({
                    email: 'me@me.com', pwd: "pippo"
                })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('trying auth with non existent user should return 404', () => {
        return (
            request(app)
                .post('/api/v1/auth/parent')
                .send({
                    email: 'me@meme.com', pwd: "pippo"
                })
                .expect('Content-Type', /json/)
                .expect(404)
        );
    });

    it('Get parent by email should return 200', () => {
        return (
            request(app)
                .get('/api/v1/super/' + newParent.email)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('email');
                    expect(response.body.email).toEqual(newParent.email);
                })
        );
    });

    it('GET parent by email without auth should return 401', () => {
        return (
            request(app)
                .get('/api/v1/super/' + newParent.email)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('GET parent by not existent email should return 404', () => {
        return (
            request(app)
                .get('/api/v1/super/nobody@no.me')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

});

describe('User endpoint', () => {

    it('Create user without auth should return 401', () => {
        return (
            request(app)
                .post('/api/v1/user/')
                .send(newUserWithoutKey)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('GET users without auth should return 401', () => {
        return (
            request(app)
                .get('/api/v1/user/parent/me@me.org')
                .expect(401)
        );
    });

    it('Create user without key should return 201 and keys', () => {
        return (
            request(app)
                .post('/api/v1/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithoutKey)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.private');
                    expect(response.body).toHaveProperty('keys.public');
                    pv1 = response.body.keys.private;
                    pk1 = response.body.keys.public;
                    id1 = response.body.ID;
                })
        );
    });

    it('Create user without keys #2 should return 201 and keys', () => {
        return (
            request(app)
                .post('/api/v1/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithoutKey2)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.private');
                    expect(response.body).toHaveProperty('keys.public');
                    pv2 = response.body.keys.private;
                    pk2 = response.body.keys.public;
                    id2 = response.body.ID;
                })
        );
    });

    it('Getting single users by parent should return 200', () => {
        return (
            request(app)
                .get('/api/v1/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual(expect.arrayContaining([{ id: id1, nick: newUserWithoutKey.nick }]));
                })
        );
    });

    it('Create user sending keys should return 201 and PubKey', () => {
        return (
            request(app)
                .post('/api/v1/user/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send(newUserWithKey)
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                    expect(response.body).toHaveProperty('keys.public');
                    expect(response.body.keys.public).toEqual(newUserWithKey.pk);
                })
        );
    });

    it('Getting users by parent should return 3 items', () => {
        return (
            request(app)
                .get('/api/v1/user/parent/me@me.com')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body.length).toEqual(3);
                })
        );
    });

    it('GET users by non existent parent should return 404', () => {
        return (
            request(app)
                .get('/api/v1/user/parent/me@me.org')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

    it('Creating new parent should return 201', () => {
        return (
            request(app)
                .post('/api/v1/super')
                .send({ email: "me@me.org", pwd: "blabla" })
                .expect('Content-Type', /json/)
                .expect(201)
                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                })
        )
    })

    it('GET users by parent should return 200 and empty array', () => {
        return (
            request(app)
                .get('/api/v1/user/parent/me@me.org')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([]);
                })
        );
    });

    it('GET user by ID with wrong token should return 401', () => {
        return (
            request(app)
                .get('/api/v1/user/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('GET user by ID withouth token should return 401', () => {
        return (
            request(app)
                .get('/api/v1/user/' + id1)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Creating device and pair with existent user without token should return 401', () => {
        return (
            request(app)
                .post('/api/v1/device/' + id1)
                .expect(401)
        );
    });

    it('Creating devices and pair with existents users should return 201', () => {
        // Create another device for test
        return (
            request(app)
                .post('/api/v1/device/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
                .then((response) => {
                    deviceId1 = response.text
                })
            &&
            request(app)
                .post('/api/v1/device/' + id2)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
                .then((response) => {
                    deviceId2 = response.text
                })
        );
    });

    it('Creating device and pair with non existent user should returns 404', () => {
        return (
            request(app)
                .post('/api/v1/device/asdfasdf')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

    it('Get JWT Tokens by user auth should return 200', () => {
        let token1 = util.btoa(id1) + '.' + util.btoa(deviceId1) + '.' + util.privEncode(deviceId1, pv1);
        let token2 = util.btoa(id2) + '.' + util.btoa(deviceId2) + '.' + util.privEncode(deviceId2, pv2);
        return (
            request(app)
                .post('/api/v1/auth/user')
                .send({ token: token1 })
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTTokenUser = authResponse.body.token;
                })
            &&
            request(app)
                .post('/api/v1/auth/user')
                .send({ token: token2 })
                .expect('Content-Type', /json/)
                .expect(200)
                .then((authResponse) => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTTokenUser2 = authResponse.body.token;
                })
        );
    });

    it('Perform user auth with unknown user should return 401', () => {
        let token = util.btoa('s' + id1) + '.' + util.btoa(deviceId1) + '.' + util.privEncode(deviceId1, pv1);
        return (
            request(app)
                .post('/api/v1/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(401)
                .then((authResponse) => {
                    expect(authResponse.body.errDesc).toEqual('User unknown');
                })
        );
    });

    it('Perform user auth with invalid token should return 401', () => {
        let token = util.btoa(id2) + '.' + util.btoa(deviceId2) + '.' + util.privEncode(deviceId1, pv2);
        return (
            request(app)
                .post('/api/v1/auth/user')
                .send({ token: token })
                .expect('Content-Type', /json/)
                .expect(401)
                .then((authResponse) => {
                    expect(authResponse.body.errDesc).toEqual('Token not valid');
                })
        );
    });

    it('Deleting device without auth should return 401', () => {
        return (
            request(app)
                .delete('/api/v1/device/' + id2)
                .expect(401)
        );
    });

    it('Deleting device should return 204', () => {
        return (
            request(app)
                .delete('/api/v1/device/' + id2)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(204)
        );
    });

});

describe('Message endpoint', () => {
    it('Sending message without connection should return 403', () => {
        return (
            request(app)
                .post('/api/v1/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect(403)
        );
    });

    it('Create connection for message test', () => {
        return (
            request(app)
                .post('/api/v1/connection/' + id1 + '/' + id2)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
                .then(() => {
                    return request(app)
                        .get('/api/v1/connection/approvalList/parent')
                        .set('Authorization', 'Bearer ' + JWTtokenParent)
                        .expect(200);
                })
                .then((res) => {
                    const conn = res.body[0];
                    return request(app)
                        .patch('/api/v1/connection/' + conn.id)
                        .set('Authorization', 'Bearer ' + JWTtokenParent)
                        .send({ status: 0 })
                        .expect(204);
                })
        );
    });

    it('Sending message should return 201', () => {
        return (
            request(app)
                .post('/api/v1/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(201)
                .then((content) => {
                    msgId = content.body.messageID;
                })
        );
    });

    it('Sending message without auth should return 401', () => {
        return (
            request(app)
                .post('/api/v1/message/')
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Sending message to non-existent user should return 404', () => {
        return (
            request(app)
                .post('/api/v1/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: 'nouser', message: util.privEncode(testMsg, pv1) })
                .expect('Content-Type', /json/)
                .expect(404)
        );
    });

    it('GET unread message list should return 200 and not empty body', () => {
        return (
            request(app)
                .get('/api/v1/message/list/' + util.MessageStatus.UNREAD)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1)
                })
        );
    });

    it('GET message should return 200 and correctly encoded message', () => {
        return (
            request(app)
                .get('/api/v1/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect('Content-Type', /json/)
                .expect(200)
                .then((content) => {
                    expect(util.pubDecode(content.body.body, pk1)).toEqual(testMsg)
                })
        );
    });

    it('GET non existent message should return 404', () => {
        return (
            request(app)
                .get('/api/v1/message/nonexists')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect('Content-Type', /json/)
                .expect(404)
        );
    });

    it('GET message without token should return 401', () => {
        return (
            request(app)
                .get('/api/v1/message/' + msgId)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('GET message with invalid token should return 401', () => {
        return (
            request(app)
                .get('/api/v1/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('GET message marks it as DOWNLOADED', () => {
        return (
            request(app)
                .get('/api/v1/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect(200)
                .then((content) => {
                    expect(content.body.status).toEqual(util.MessageStatus.DOWNLOADED);
                })
        );
    });

    it('GET unread list after download should return 404', () => {
        return (
            request(app)
                .get('/api/v1/message/list/' + util.MessageStatus.UNREAD)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect(404)
        );
    });

    it('DELETE message (ACK) should return 204', () => {
        return (
            request(app)
                .delete('/api/v1/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser2)
                .expect(204)
        );
    });

    it('GET deleted message should return 404', () => {
        return (
            request(app)
                .get('/api/v1/message/' + msgId)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(404)
        );
    });

    it('DELETE non-existent message should return 404', () => {
        return (
            request(app)
                .delete('/api/v1/message/nonexists')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(404)
        );
    });

    it('DELETE message without auth should return 401', () => {
        return (
            request(app)
                .delete('/api/v1/message/' + msgId)
                .expect('Content-Type', /json/)
                .expect(401)
        );
    });

    it('Sender can withdraw unread message should return 204', () => {
        let sentMsgId;
        return (
            request(app)
                .post('/api/v1/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect(201)
                .then((content) => {
                    sentMsgId = content.body.messageID;
                    return request(app)
                        .delete('/api/v1/message/' + sentMsgId)
                        .set('Authorization', 'Bearer ' + JWTTokenUser)
                        .expect(204);
                })
        );
    });

    it('Sender cannot withdraw read message should return 400', () => {
        let sentMsgId;
        return (
            request(app)
                .post('/api/v1/message/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .send({ to: id2, message: util.privEncode(testMsg, pv1) })
                .expect(201)
                .then((content) => {
                    sentMsgId = content.body.messageID;
                    // Recipient downloads (marks as DOWNLOADED)
                    return request(app)
                        .get('/api/v1/message/' + sentMsgId)
                        .set('Authorization', 'Bearer ' + JWTTokenUser2)
                        .expect(200);
                })
                .then(() => {
                    // Sender tries to withdraw
                    return request(app)
                        .delete('/api/v1/message/' + sentMsgId)
                        .set('Authorization', 'Bearer ' + JWTTokenUser)
                        .expect(400);
                })
        );
    });

});

describe('Connections endpoint', () => {
    it('GET connections list by user should return 200', () => {
        return (
            request(app)
                .get('/api/v1/connection/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1);
                })
        );
    });

    it('GET connections list by user with bad token should return 401', () => {
        return (
            request(app)
                .get('/api/v1/connection/')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(401)
                .then((content) => {
                    expect(content.body.errCode).toEqual(7);
                })
        );
    });

    it('GET connections list by parent should return 200', () => {
        return (
            request(app)
                .get('/api/v1/connection/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1);
                })
        );
    });

    it('GET empty connections list by parent with not existent user should return 404', () => {
        return (
            request(app)
                .get('/api/v1/connection/baduser')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(404)
        );
    });

    it('GET (empty) approval list should return 200 and empty body', () => {
        let parentId = JSON.parse(util.atob(JWTtokenParent.split('.')[1])).user;
        return (
            request(app)
                .get('/api/v1/connection/approvalList/' + parentId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(0);
                })
        );
    });

    it('Requesting connection should return 201', () => {
        return (
            request(app)
                .post('/api/v1/connection/' + id2 + '/' + id1)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(201)
        );
    });

    it('GET approval list should return 200 and not empty body', () => {
        let parentId = JSON.parse(util.atob(JWTtokenParent.split('.')[1])).user;
        return (
            request(app)
                .get('/api/v1/connection/approvalList/' + parentId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1);
                    connId = content.body[0].id;
                })
        );
    });

    it('Changing connection request status without new status should return 400', () => {
        return (
            request(app)
                .patch('/api/v1/connection/' + connId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .expect(400)
                .then((content) => {
                    expect(content.body.errCode).toEqual(9)
                })
        );
    });

    it('Changing connection request status without auth should return 401', () => {
        return (
            request(app)
                .patch('/api/v1/connection/' + connId)
                .expect(401)
                .then((content) => {
                    expect(content.body.errCode).toEqual(1)
                })
        );
    });

    it('Changing connection request status with wrong auth profile should return 401', () => {
        return (
            request(app)
                .patch('/api/v1/connection/' + connId)
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(401)
                .then((content) => {
                    expect(content.body.errCode).toEqual(7)
                })
        );
    });

    it('Changing connection request status with not existent connectionId should return 404', () => {
        return (
            request(app)
                .patch('/api/v1/connection/badconnid')
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send({ status: util.ConnectionStatus.ACCEPTED })
                .expect(404)
        );
    });

    it('Reject connection request status should return 204', () => {
        return (
            request(app)
                .patch('/api/v1/connection/' + connId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send({ status: util.ConnectionStatus.REJECTED })
                .expect(204)
        );
    });

    it('Get connections list by user after rejecting should return 200', () => {
        return (
            request(app)
                .get('/api/v1/connection/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(1);
                })
        );
    });

    it('Accept connection request status', () => {
        return (
            request(app)
                .patch('/api/v1/connection/' + connId)
                .set('Authorization', 'Bearer ' + JWTtokenParent)
                .send({ status: util.ConnectionStatus.ACCEPTED })
                .expect(204)
        );
    });

    it('Get connections list by user after approval should return 200 and not empty body', () => {
        return (
            request(app)
                .get('/api/v1/connection/')
                .set('Authorization', 'Bearer ' + JWTTokenUser)
                .expect(200)
                .then((content) => {
                    expect(content.body.length).toEqual(2);
                    expect(content.body[0]).toEqual(id2);
                })
        );
    });

});

