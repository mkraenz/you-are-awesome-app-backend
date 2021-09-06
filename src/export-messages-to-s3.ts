import type { Handler } from "aws-lambda";
import { Lambda, S3 } from "aws-sdk";
import { parse } from "./util/parse";
import { respond } from "./util/respond";
import { assertEnvVar } from "./util/assert";

interface Env {
    AWS_REGION?: string;
    GSX2JSON_LAMBDA_ARN: string;
    BUCKET_NAME: string;
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(env.GSX2JSON_LAMBDA_ARN, "GSX2JSON_LAMBDA_ARN");
    assertEnvVar(env.BUCKET_NAME, "BUCKET_NAME");
}

const env = process.env;
assertEnv(env);

const lambda = new Lambda({ region: env.AWS_REGION });
const s3 = new S3({ region: env.AWS_REGION });

export const handler: Handler = async () => {
    try {
        const res = await lambda
            .invoke({
                FunctionName: env.GSX2JSON_LAMBDA_ARN,
            })
            .promise();

        if (res.StatusCode !== 200 || !res.Payload) {
            console.error(JSON.stringify(res));
            throw new Error("Fetch from gsx2json lambda failed");
        }
        const payload = res.Payload;
        if (!payload || typeof payload !== "string")
            throw new Error("res.payload is not a string");
        // body was stringified by gsx2json handler => need to parse twice
        const body: unknown = parse<{ body: { rows?: string } }>(payload).body;
        if (typeof body !== "string")
            throw new Error("res.payload.body must be a string");
        const messages = parse<{ rows: { messages?: any[] } }>(body).rows;
        if (!Array.isArray(messages))
            throw new Error("Messages not in expected array format");
        if (messages.length === 0) throw new Error("Messages array is empty");
        console.log({ NumOfMessagesPutToS3: messages.length });
        await s3
            .putObject({
                Bucket: env.BUCKET_NAME,
                ACL: "public-read",
                Body: JSON.stringify(messages, null, 2),
                Key: "messages.json",
                ContentType: "application/json",
            })
            .promise();

        const resBodyObj = { message: "Success" };
        return respond(200, resBodyObj);
    } catch (error) {
        return respond(500, error as Error);
    }
};
