import type { Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import Expo from "expo-server-sdk";
import { respond } from "../utils/respond";
import { handleSuccessTicketEnv } from "./exchangeTicketsForReceipts.env";
import { ExpoReceiptAdapter } from "./ExpoReceiptsAdapter";
import { TicketExchange } from "./TicketExchange";
import { TicketRepository } from "./TicketRepository";

const env = handleSuccessTicketEnv;
const { TICKET_TABLE: ticketTable } = env;

const serviceConfigOptions: ServiceConfigurationOptions = {
    region: env.AWS_REGION,
    endpoint: env.IS_OFFLINE ? "http://localhost:7999" : undefined,
};

const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

const expo = new Expo();
const expoReceipts = new ExpoReceiptAdapter(expo);
const tickets = new TicketRepository(docClient, ticketTable);
const ticketHandler = new TicketExchange(tickets, expoReceipts);

export const handler: Handler = async () => {
    try {
        const result = await ticketHandler.handleSuccessTickets();
        return respond(200, { success: true, ...result });
    } catch (error) {
        return respond(500, error as Error);
    }
};
