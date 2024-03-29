import type { APIGatewayProxyResultV2, Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import { APIGatewayValidatedProxyEvent } from "../util/aws";
import { parse } from "../util/parse";
import { respond, respondError } from "../util/respond";
import { assertEnvVar, assertToken } from "../util/assert";
import { SubscriptionRepository } from "./SubscriptionRepository";

interface IBody {
    token: string;
}

const serviceConfigOptions: ServiceConfigurationOptions = {
    region: process.env.AWS_REGION,
    endpoint: process.env.IS_OFFLINE ? "http://localhost:7999" : undefined,
};

const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);
assertEnvVar(process.env.SUBSCRIPTION_TABLE, "SUBSCRIPTION_TABLE");
const TableName = process.env.SUBSCRIPTION_TABLE;
const subs = new SubscriptionRepository(docClient, TableName);

export const handler: Handler<
    APIGatewayValidatedProxyEvent,
    APIGatewayProxyResultV2<{ statusCode: number }>
> = async event => {
    try {
        // validation on API Gateway
        const { body } = event;
        const { token } = await parse<IBody>(body);
        assertToken(token);

        await subs.delete(token);

        return respond(200, { success: true });
    } catch (error) {
        return respondError(error as Error);
    }
};
