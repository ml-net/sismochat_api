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
RESEND_API_KEY=re_xxxxxxxx
RESET_FROM_EMAIL=onboarding@resend.dev
RESET_TOKEN_TTL_MINUTES=30
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:noreply@sismochat.marcolupi.net
```

where
- `PORT` is not mandatory (the default value of `3000` will be used in its absence), 
- `NODE_ENV` must be set to `development` to create local copy of database, sqlite for dev environment
- `JWT_SECRET` is you secret for JWT, in production there is another value!
- `RESEND_API_KEY` is your Resend API key for sending emails (optional in dev — OTP will be logged to console)
- `RESET_FROM_EMAIL` is the sender address for reset emails (default: `onboarding@resend.dev`)
- `RESET_TOKEN_TTL_MINUTES` is the OTP expiry time in minutes (default: 30)
- `RESET_RATE_LIMIT_WINDOW_MINUTES` is the rate limit window for reset requests (default: 15)
- `VAPID_PUBLIC_KEY` is the VAPID public key for Web Push notifications (optional in dev — push disabled if missing)
- `VAPID_PRIVATE_KEY` is the VAPID private key for Web Push notifications (optional in dev — push disabled if missing)
- `VAPID_SUBJECT` is the VAPID subject (mailto: or URL, default: `mailto:noreply@sismochat.marcolupi.net`)

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and workflow guidelines.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
