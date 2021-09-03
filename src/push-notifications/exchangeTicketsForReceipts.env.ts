import { assertEnvVar } from "../validation/assert";

interface Env {
    REGION: string;
    SUBSCRIPTION_TABLE: string;
    TICKET_TABLE: string;
    SUBSCRIPTIONS_BY_TIME_INDEX: string;
    IS_OFFLINE?: string; // only set when running locally with serverless-offline. automatically set
}

function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(process.env.REGION, "REGION");
    assertEnvVar(process.env.SUBSCRIPTION_TABLE, "SUBSCRIPTION_TABLE");
    assertEnvVar(process.env.TICKET_TABLE, "TICKET_TABLE");
    assertEnvVar(
        process.env.SUBSCRIPTIONS_BY_TIME_INDEX,
        "SUBSCRIPTIONS_BY_TIME_INDEX"
    );
}

const env = process.env;
assertEnv(env);

export const handleSuccessTicketEnv = env;
