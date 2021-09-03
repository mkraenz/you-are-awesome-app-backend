import { FailedParsing, InvalidArgument } from "../util/custom.error";

export const respond = (statusCode: number, body: object | Error) => {
    if (body instanceof Error) {
        if (statusCode >= 500) {
            console.error(body);
            // https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
            throw body;
        }
        return {
            statusCode,
            body: JSON.stringify({ error: true, message: body.message }),
            headers: {
                "Content-Type": "application/json",
            },
        };
    }
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    };
};

export const respondError = (error: Error) => {
    if (error instanceof InvalidArgument) return respond(400, error);
    if (error instanceof FailedParsing) {
        console.error("Hooman, pleez improve validation logic", error);
        return respond(400, error);
    }
    return respond(500, error);
};
