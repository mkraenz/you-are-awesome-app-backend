import { Handler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import Expo from "expo-server-sdk";
import { respond } from "../utils/respond";
import { assertEnvVar } from "../validation/assert";
import { TicketHandler } from "./TicketHandler";

interface Env {
    TICKETS_TABLE_NAME: string;
    REGION: string;
}
function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(env.REGION, "REGION");
    assertEnvVar(env.TICKETS_TABLE_NAME, "TICKETS_TABLE_NAME");
}
const env = process.env;
assertEnv(env);

const expo = new Expo();
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: env.REGION,
    endpoint: process.env.IS_OFFLINE ? "http://localhost:7999" : undefined,
};
const docClient = new DynamoDB.DocumentClient(serviceConfigOptions);
const ticketHandler = new TicketHandler(
    docClient,
    env.TICKETS_TABLE_NAME,
    expo,
    // TODO #535
    { unregister: () => Promise.resolve() }
);

export const handler: Handler = async () => {
    try {
        await ticketHandler.handleSuccessTickets();
        const resBodyObj = { message: "Success" };
        return respond(200, resBodyObj);
    } catch (error) {
        return respond(500, error.message);
    }
};
