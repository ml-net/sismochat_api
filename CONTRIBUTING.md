# Contributing to SiSMoChat API

## Local Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:ml-net/sismochat_api.git
   cd sismochat_api
   ```

2. Create a `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_secret_here
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

5. Start the server:
   ```bash
   npm start
   ```

   API docs available at http://localhost:3000/doc

## Running Tests

```bash
npm test
```

This resets the test database and runs all tests with Jest.

## Testing Password Reset Locally

Without a Resend API key, the OTP is logged to the server console instead of being emailed:

```
[email] RESEND_API_KEY not set, OTP not sent: 384721
```

To test without consuming the Resend free tier:
1. Remove or comment out `RESEND_API_KEY` in your `.env`
2. Restart the server
3. Trigger a reset request — copy the OTP from the console output
4. Use it in the reset confirmation step

To test with real emails, add `RESEND_API_KEY=re_xxxxx` to `.env` (get a key at [resend.com](https://resend.com)).

## Git Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b <type>/<short-description>
   ```

2. Make your changes and commit following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   <type>(<scope>): <description>

   [optional body]
   ```

   Allowed types:
   - `feat` — new feature
   - `fix` — bug fix
   - `refactor` — code change that neither fixes a bug nor adds a feature
   - `docs` — documentation only
   - `chore` — maintenance (deps, config, CI)
   - `test` — adding or updating tests
   - `style` — formatting, no code change
   - `perf` — performance improvement

   Examples:
   ```
   feat(auth): add rate limiting on login endpoint
   fix(message): handle empty body validation
   docs: update README with commit convention
   ```

   Commit messages are validated by `commitlint` via a git hook — non-conforming messages will be rejected.

3. Push and open a PR:
   ```bash
   git push -u origin <branch-name>
   ```

4. Wait for CI to pass, then squash merge.

## Branch Protection

- Direct pushes to `main` are blocked (GitHub rules + local pre-push hook)
- All changes go through PRs with CI checks

## Docker

```bash
docker build -t sismochat-api .
docker run -p 3000:3000 -e JWT_SECRET=mysecret -e NODE_ENV=production sismochat-api
```
