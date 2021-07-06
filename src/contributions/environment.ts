import { MissingEnvironmentVariable } from "../util/custom.error";

interface Env {
    CONTRIBUTIONS_SPREADSHEET_ID: string;
    CONTRIBUTIONS_GOOGLE_EMAIL: string;
    CONTRIBUTIONS_GOOGLE_PRIVATE_KEY: string;
}

export function assertEnv(env: Partial<Env>): asserts env is Env {
    if (!env.CONTRIBUTIONS_SPREADSHEET_ID)
        throw new MissingEnvironmentVariable("CONTRIBUTIONS_SPREADSHEET_ID");
    if (!env.CONTRIBUTIONS_GOOGLE_EMAIL)
        throw new MissingEnvironmentVariable("CONTRIBUTIONS_GOOGLE_EMAIL");
    if (!env.CONTRIBUTIONS_GOOGLE_PRIVATE_KEY)
        throw new MissingEnvironmentVariable(
            "CONTRIBUTIONS_GOOGLE_PRIVATE_KEY"
        );
}

/** newline char in env var needs transformation
 * https://github.com/auth0/node-jsonwebtoken/issues/642#issuecomment-585173594 */
export const unescapeNewline = (str: string) => str.replace(/\\n/gm, "\n");
