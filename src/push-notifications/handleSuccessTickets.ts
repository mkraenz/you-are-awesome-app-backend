import { Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import Expo from "expo-server-sdk";
import { respond } from "../utils/respond";
import { assertEnvVar } from "../validation/assert";
import { ExpoReceiptAdapter } from "./ExpoReceiptsAdapter";
import { SubscriptionRepository } from "./SubscriptionRepository";
import { TicketHandler } from "./TIcketHandler";
import { TicketRepository } from "./TicketRepository";

interface Env {
    REGION: string;
    SUBSCRIPTION_TABLE: string;
    TICKET_TABLE: string;
    SUBSCRIPTIONS_BY_TIME_INDEX: string;
    IS_OFFLINE?: string; // only set when running locally with serverless-offline. automatically set
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(process.env.REGION, "REGION");
    assertEnvVar(process.env.SUBSCRIPTION_TABLE, "SUBSCRIPTION_TABLE");
    assertEnvVar(process.env.TICKET_TABLE, "TICKET_TABLE");
    assertEnvVar(
        process.env.SUBSCRIPTIONS_BY_TIME_INDEX,
        "SUBSCRIPTIONS_BY_TIME_INDEX"
    );
}

const env = process.env;
assertEnv(env);
const {
    SUBSCRIPTION_TABLE: subsTable,
    TICKET_TABLE: ticketTable,
    SUBSCRIPTIONS_BY_TIME_INDEX: subsByTimeIndex,
} = env;

const serviceConfigOptions: ServiceConfigurationOptions = {
    region: env.REGION,
    endpoint: env.IS_OFFLINE ? "http://localhost:7999" : undefined,
};

const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

const subs = new SubscriptionRepository(docClient, subsTable, subsByTimeIndex);
const expo = new Expo();
const expoReceipts = new ExpoReceiptAdapter(expo);
const tickets = new TicketRepository(docClient, ticketTable);
const ticketHandler = new TicketHandler(subs, tickets, expoReceipts, console);

export const handler: Handler = async () => {
    try {
        const result = await ticketHandler.handleSuccessTickets();
        return respond(200, { success: true, ...result });
    } catch (error) {
        return respond(500, error);
    }
};
