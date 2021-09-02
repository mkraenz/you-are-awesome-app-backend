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

## Development

### Invoke non-API Gateway exposed Lambda functions

[Reference Serverless Offline Docs](https://www.serverless.com/plugins/serverless-offline#usage-with-invoke)

Start serverless offline with `yarn dev`.
In the console output find

```log
offline: Offline [http for lambda] listening on http://localhost:3002
offline: Function names exposed for local invocation by aws-sdk:
           * reportInappropriate: youareawesomeapp-prod-reportInappropriate
```

Then invoke that function with

```sh
aws lambda invoke /dev/null \
  --endpoint-url http://localhost:3002 \
  --function-name youareawesomeapp-prod-reportInappropriate
```

### DynamoDB

Run via Docker Compose on port `7999`:
`docker-compose up -d`

Access from AWS NoSQL Workbench:

- Download from [AWS NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html)
- On Linux: Make the `.AppImage` executable
- run the `.AppImage`
- Open DynamoDb Workbench -> Operations Builder -> Add connection -> DynamoDB local -> port 7999
- create a table with the script `create-table.ts` (adjust code accordingly)
- Select the Table to see its Items

#### Issues

The `docker-compose.yml` from AWS Docs errored when trying to actually connect. It's caused by a permission issue inside the container. Added `user: root` to fix it.

## Links

- [Serverless Dashboard](https://dashboard.serverless.com)
- [AWS Console EU Central](https://eu-central-1.console.aws.amazon.com/console/home?region=eu-central-1#)
