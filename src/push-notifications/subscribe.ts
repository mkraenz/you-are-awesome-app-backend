import { APIGatewayProxyResultV2, Handler } from "aws-lambda";
import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import { APIGatewayValidatedProxyEvent } from "../utils/aws";
import { parse } from "../utils/parse";
import { respond, respondError } from "../utils/respond";
import { assertEnvVar, assertToken } from "../validation/assert";
import { SubscriptionRepository } from "./SubscriptionRepository";

interface IBody {
    token: string;
    hour: number;
    minute: number;
}

class Body implements IBody {
    constructor(param: IBody) {
        this.token = param.token;
        this.hour = param.hour;
        this.minute = param.minute;
    }

    token: string;

    hour: number;

    minute: number;

    /** @returns in format HH:mm */
    get time(): string {
        const date = new Date();
        date.setHours(this.hour, this.minute);
        return date.toTimeString().slice(0, 5);
    }
}

// https://github.com/aws/aws-sdk-js/issues/1635#issuecomment-316486871
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: process.env.REGION,
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
        const parsedBody = await parse<IBody>(body);
        const { token, time } = new Body(parsedBody);
        assertToken(token);

        await subs.put(token, time);
        return respond(200, { success: true });
    } catch (error) {
        return respondError(error);
    }
};
