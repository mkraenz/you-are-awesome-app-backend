import type { Handler } from "aws-lambda";
import { S3 } from "aws-sdk";
import { gsheetsToMessages } from "./messages/gsheetsToMessages";
import { assertEnvVar } from "./util/assert";
import { respond } from "./util/respond";

interface Env {
    AWS_REGION?: string;
    BUCKET_NAME: string;
    MESSAGES_SPREADSHEET_PUBLIC_ID: string;
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(
        env.MESSAGES_SPREADSHEET_PUBLIC_ID,
        "MESSAGES_SPREADSHEET_PUBLIC_ID"
    );
    assertEnvVar(env.BUCKET_NAME, "BUCKET_NAME");
}

const env = process.env;
assertEnv(env);

const s3 = new S3({ region: env.AWS_REGION });

export const handler: Handler = async () => {
    try {
        const messages = await gsheetsToMessages(
            env.MESSAGES_SPREADSHEET_PUBLIC_ID
        );
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
