const request = require('supertest');
const baseURL = 'http://localhost:3333/api';
const app = require('../app');

const newParent = {
    email: 'me@me.com',
    pwd: "blablabla",
}

var JWTtoken;

describe('Parent endpoint', () => {
    it('Create a new parent', () => {
        return (
            request(app)
                .post('/api/super')

                // Item send code

                .send(newParent)

                .expect('Content-Type', /json/)

                .expect(201)

                .then((response) => {
                    expect(response.body).toHaveProperty('ID');
                })
        );
    });

    it('Get JWT Token by auth', () => {
        return (
            request(app)
                .post('/api/auth/parent')
                .send(newParent)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(authResponse => {
                    expect(authResponse.body).toHaveProperty('token');
                    JWTtoken = authResponse.body.token;
                })
        );
    });

    it('get parent by email', () => {
        return (
            request(app)

                .get('/api/super/' + newParent.email)
                .set('Authorization', 'Bearer ' + JWTtoken)
                .expect('Content-Type', /json/)

                .expect(200)

                .then((response) => {
                    expect(response.body).toHaveProperty('email');
                    expect(response.body.email).toEqual(newParent.email);
                })
        );
    });

    
    it('get parent without auth', () => {
        return (
            request(app)

                .get('/api/super/' + newParent.email)

                .expect('Content-Type', /json/)

                .expect(401)

        );
    });



})