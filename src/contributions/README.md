# Writing to Google Sheets

## Service Account Setup

1. Enable Google Sheets API
2. Create a service account
3. Add apikey to service account
4. Add service account's email as Editor to the Spreadsheet
5. Set env vars
6. enable skipped tests in `appendToGSheets.test.ts`
7. Run `yarn test appendToGS` to ensure successful setup
8. cleanup the user contributions spreadsheet

## Links

- [Google Cloud Platform Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=youareawesomeapp-1571923858600)

## Resources

- [Connecting to Google Sheets with Pictures](https://www.dundas.com/support/learning/documentation/connect-to-data/how-to/connecting-to-google-sheets)
- [Accessing Google APIs using service account nodejs](https://isd-soft.com/tech_blog/accessing-google-apis-using-service-account-node-js/)
- [Google Cloud Docs Passing Service Accounts credentials manually](https://cloud.google.com/docs/authentication/production?hl=en#auth-cloud-implicit-nodejs)
