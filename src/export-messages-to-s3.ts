import { Handler } from "aws-lambda";
import { Lambda, S3 } from "aws-sdk";
import { respond } from "./utils/respond";

interface Env {
    REGION: string;
    GSX2JSON_LAMBDA_ARN: string;
    BUCKET_NAME: string;
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    if (!process.env.REGION) {
        throw new Error("Missing env var REGION");
    }
    if (!process.env.GSX2JSON_LAMBDA_ARN) {
        throw new Error("Missing env var GSX2JSON_LAMBDA_ARN");
    }
    if (!process.env.BUCKET_NAME) {
        throw new Error("Missing env var BUCKET_NAME");
    }
}

const env = process.env;
assertEnv(env);

const lambda = new Lambda({ region: env.REGION });
const s3 = new S3({ region: env.REGION });

export const handler: Handler<{ body: string }> = async (event, context) => {
    try {
        const res = await lambda
            .invoke({
                FunctionName: process.env.GSX2JSON_LAMBDA_ARN!,
                Payload: JSON.stringify({
                    queryStringParameters: {
                        id: "1n3mhIrBpeAEQVKcparkZPdCnleYFRr06jo80aUtcHgI",
                        sheet: "1",
                        columns: "false",
                    },
                }),
            })
            .promise();
        if (res.StatusCode !== 200 || !res.Payload) {
            console.error(JSON.stringify(res));
            throw new Error("Fetch from gsx2json lambda failed");
        }
        const payload = res.Payload;
        if (!(payload && typeof payload === "string"))
            throw new Error("res.payload is not a string");
        // body was stringified by gsx2json handler => need to parse twice
        const body: unknown = JSON.parse(payload).body;
        if (typeof body !== "string")
            throw new Error("res.payload.body must be a string");
        const messages = JSON.parse(body).rows;
        await s3
            .putObject({
                Bucket: process.env.BUCKET_NAME!,
                ACL: "public-read",
                Body: JSON.stringify(messages, null, 2),
                Key: "messages.json",
                ContentType: "application/json",
            })
            .promise();

        const resBodyObj = { message: "Success" };
        return respond(200, resBodyObj);
    } catch (error) {
        return respond(500, error);
    }
};
