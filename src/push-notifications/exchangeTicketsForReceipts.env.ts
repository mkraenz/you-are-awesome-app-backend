import { assertEnvVar } from "../util/assert";

interface Env {
    TICKET_TABLE: string;
    IS_OFFLINE?: string; // only set when running locally with serverless-offline. automatically set
    AWS_REGION?: string; // set automatically by serverless-offline and in aws
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(process.env.TICKET_TABLE, "TICKET_TABLE");
}

const env = process.env;
assertEnv(env);

export const handleSuccessTicketEnv = env;
