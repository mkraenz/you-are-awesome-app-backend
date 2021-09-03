import { assertEnvVar } from "../validation/assert";

interface Env {
    CONTRIBUTIONS_SPREADSHEET_ID: string;
    CONTRIBUTIONS_GOOGLE_EMAIL: string;
    CONTRIBUTIONS_GOOGLE_PRIVATE_KEY: string;
}

export function assertEnv(env: Partial<Env>): asserts env is Env {
    assertEnvVar(
        env.CONTRIBUTIONS_SPREADSHEET_ID,
        "CONTRIBUTIONS_SPREADSHEET_ID"
    );
    assertEnvVar(env.CONTRIBUTIONS_GOOGLE_EMAIL, "CONTRIBUTIONS_GOOGLE_EMAIL");
    assertEnvVar(
        env.CONTRIBUTIONS_GOOGLE_PRIVATE_KEY,
        "CONTRIBUTIONS_GOOGLE_PRIVATE_KEY"
    );
}

/** newline char in env var needs transformation
 * https://github.com/auth0/node-jsonwebtoken/issues/642#issuecomment-585173594 */
export const unescapeNewline = (str: string) => str.replace(/\\n/gm, "\n");
