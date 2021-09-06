import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import {
    createGsiSubsByTime,
    createSubsTable,
    createTicketsTable,
    dropTable,
} from "../test/createTable.learning";

const subsTable = "PushNotifSubs-prod";
const ticketsTable = "NotificationTickets-prod";

// https://github.com/aws/aws-sdk-js/issues/1635#issuecomment-316486871
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: "us-west-2",
    endpoint: "http://localhost:7999",
};

const dynamodb = new AWS.DynamoDB(serviceConfigOptions);

const setupDynamoDbForLocalDev = async () => {
    await createSubsTable(dynamodb, subsTable);
    await createTicketsTable(dynamodb, ticketsTable);
    await createGsiSubsByTime(dynamodb, subsTable, "TimeIndex");
    console.log(`Setup completed. Tables: ${subsTable}, ${ticketsTable}`);
};

const resetDynamoDbForLocalDev = async () => {
    console.log(`Dropping tables ${subsTable} and ${ticketsTable}`);
    await dropTable(dynamodb, subsTable);
    await dropTable(dynamodb, ticketsTable);
};

const main = async (hardReset = process.argv[2]) => {
    if (hardReset === "--hard-reset") {
        try {
            await resetDynamoDbForLocalDev();
        } catch (error) {
            if (
                (error as Error).message.includes(
                    "Cannot do operations on a non-existent table"
                )
            ) {
                console.log(
                    "No tables to drop. Ignoring error. Continuing setup"
                );
            } else {
                throw error;
            }
        }
    }
    await setupDynamoDbForLocalDev();
};

main();
