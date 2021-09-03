import { APIGatewayProxyEvent } from "aws-lambda";

export type APIGatewayValidatedProxyEvent = APIGatewayProxyEvent & {
    body: string;
};
