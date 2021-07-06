import type { Handler } from "aws-lambda";
import { FailedParsing, InvalidArgument } from "../util/custom.error";
import { parse } from "../utils/parse";
import { respond } from "../utils/respond";
import { appendToGSheets, setupGoogleAuth } from "./appendToGSheets";
import { assertEnv, unescapeNewline } from "./environment";
import { IMessage } from "./IMessage";
import { assertMessage } from "./validate";

const env = process.env;
assertEnv(env);

export const writeContributionToGsheet: Handler<{
    body: string;
    httpMethod: "POST";
}> = async event => {
    console.log("Received body:", event.body);

    try {
        const message = parse<IMessage>(event.body);
        assertMessage(message);
        const auth = setupGoogleAuth({
            email: env.CONTRIBUTIONS_GOOGLE_EMAIL,
            privateKey: unescapeNewline(env.CONTRIBUTIONS_GOOGLE_PRIVATE_KEY),
        });
        await appendToGSheets(message, auth, env.CONTRIBUTIONS_SPREADSHEET_ID);
        return respond(201, message);
    } catch (error) {
        if (error instanceof FailedParsing) return respond(400, error);
        if (error instanceof InvalidArgument) return respond(400, error);
        return respond(500, error);
    }
};
