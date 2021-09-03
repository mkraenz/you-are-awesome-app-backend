import { Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import Expo from "expo-server-sdk";
import { respond } from "../utils/respond";
import { ExpoReceiptAdapter } from "./ExpoReceiptsAdapter";
import { handleSuccessTicketEnv } from "./exchangeTicketsForReceipts.env";
import { SubscriptionRepository } from "./SubscriptionRepository";
import { TicketHandler } from "./TicketExchange";
import { TicketRepository } from "./TicketRepository";

const env = handleSuccessTicketEnv;
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
const ticketHandler = new TicketHandler(subs, tickets, expoReceipts);

export const handler: Handler = async () => {
    try {
        const result = await ticketHandler.handleSuccessTickets();
        return respond(200, { success: true, ...result });
    } catch (error) {
        return respond(500, error);
    }
};
