# Serverless Backend for You are Awesome App! Daily Motivation Up

Awesome!

## Architecture Diagram

[diagram on gdrive](https://drive.google.com/file/d/16q4tDXvDJJmJJllpi_lgGpntYiB_nEjh/view?usp=sharing)

## Functions

- Sends a notification email on user reported content (i.e. inappropriate or objectionable content).
- Register for push notifications
- Unregister from push notifications
- Send Push notifications
- gsx2json - Google Sheets to JSON
- Write contributions to Google Sheets

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
