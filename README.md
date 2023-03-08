# API for SiSMoChat

## Content

This project implements the SiSMoChat API and server's features.

API documentation will be released according OpenAPI spec.

## Local installation

After cloning this repo, you must create a `.env` file like this

```
PORT=1234
NODE_ENV=development
JWT_SECRET=trytoguess
```

where
- `PORT` is not mandatory (the default value of `3000` will be used in its absence), 
- `NODE_ENV` must be set to `development` to create local copy of database, sqlite for dev environment
- `JWT_SECRET` is you secret for JWT, in production there is another value!

Then, you must run

```
npm init
npx sequelize db:migrate
```

Now, `npm start` execute the server, enjoy!

## Testing

There are a suite of tests, based on `Jest` / `supertest`; to launch the test type 

``` 
npm test 
```

A test DB instance will be created and tests will run on it.