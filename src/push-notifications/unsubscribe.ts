import type { APIGatewayProxyResultV2, Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import { APIGatewayValidatedProxyEvent } from "../utils/aws";
import { parse } from "../utils/parse";
import { respond, respondError } from "../utils/respond";
import { assertEnvVar, assertToken } from "../validation/assert";
import { SubscriptionRepository } from "./SubscriptionRepository";

interface IBody {
    token: string;
}

// https://github.com/aws/aws-sdk-js/issues/1635#issuecomment-316486871
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

        return respond(202, { success: true });
    } catch (error) {
        return respondError(error as Error);
    }
};
