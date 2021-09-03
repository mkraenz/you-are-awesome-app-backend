import type { Handler } from "aws-lambda";
import { parse } from "../utils/parse";
import { respond, respondError } from "../utils/respond";
import { appendToGSheets, setupGoogleAuth } from "./appendToGSheets";
import { assertEnv, unescapeNewline } from "./environment";
import { IMessage } from "./IMessage";

const env = process.env;
assertEnv(env);

export const writeContributionToGsheet: Handler<{
    body: string;
    httpMethod: "POST";
}> = async event => {
    console.log({ msg: "Received body", body: event.body });

    try {
        // validation on API Gateway
        const message = parse<IMessage>(event.body);
        const auth = setupGoogleAuth({
            email: env.CONTRIBUTIONS_GOOGLE_EMAIL,
            privateKey: unescapeNewline(env.CONTRIBUTIONS_GOOGLE_PRIVATE_KEY),
        });
        await appendToGSheets(message, auth, env.CONTRIBUTIONS_SPREADSHEET_ID);
        return respond(201, message);
    } catch (error) {
        return respondError(error as Error);
    }
};
