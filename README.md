# Serverless Backend for You are Awesome App! Daily Motivation Up

Awesome!

- Sends a notification email on user reported content (i.e. inappropriate or objectionable content).
- Register for push notifications
- Unregister from push notifications
- Send Push notifications

## Deployment

WARNING: Sending push notifications is in a separate deploy command, in order to hide the URI.

- Ensure a `.env` file exists with environment variables set properly. (see password manager)
- `yarn deploy:test`
- Test whether email sending works by executing `post.http`
- Also take a look at `secret.http`
- on success: `yarn deploy`

## Links

- [Serverless Dashboard](https://dashboard.serverless.com)
- [AWS Console EU Central](https://eu-central-1.console.aws.amazon.com/console/home?region=eu-central-1#)
