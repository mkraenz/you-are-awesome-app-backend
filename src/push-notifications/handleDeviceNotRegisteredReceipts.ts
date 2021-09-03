import { Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import { respond } from "../utils/respond";
import { assertEnvVar } from "../validation/assert";
import { DeviceNotRegisteredHandler } from "./DeviceNotRegisteredHandler";
import { handleSuccessTicketEnv } from "./exchangeTicketsForReceipts.env";
import { SubscriptionRepository } from "./SubscriptionRepository";
import { TicketRepository } from "./TicketRepository";

const env = handleSuccessTicketEnv;
const { SUBSCRIPTION_TABLE: subsTable, TICKET_TABLE: ticketTable } = env;
assertEnvVar(subsTable, "SUBSCRIPTION_TABLE");
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: env.AWS_REGION,
    endpoint: env.IS_OFFLINE ? "http://localhost:7999" : undefined,
};

const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

const subs = new SubscriptionRepository(docClient, subsTable);
const tickets = new TicketRepository(docClient, ticketTable);
const dnr = new DeviceNotRegisteredHandler(tickets, subs);

export const handler: Handler = async () => {
    try {
        const result = await dnr.unsubscribeAffectedExpoPushTokens();
        return respond(200, { success: true, ...result });
    } catch (error) {
        return respond(500, error as Error);
    }
};
