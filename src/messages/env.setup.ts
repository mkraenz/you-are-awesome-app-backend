import { assertEnvVar } from "../util/assert";

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

export const exportMessagesToS3Env = env;
