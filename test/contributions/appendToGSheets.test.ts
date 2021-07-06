import {
    appendToGSheets,
    setupGoogleAuth,
} from "../../src/contributions/appendToGSheets";
import {
    assertEnv,
    unescapeNewline,
} from "../../src/contributions/environment";
import { IMessage } from "../../src/contributions/IMessage";

const systemUnderTest = async (body: IMessage) => {
    const env = process.env;
    assertEnv(env);
    const auth = setupGoogleAuth({
        email: env.CONTRIBUTIONS_GOOGLE_EMAIL,
        privateKey: unescapeNewline(env.CONTRIBUTIONS_GOOGLE_PRIVATE_KEY),
    });
    await appendToGSheets(body, auth, env.CONTRIBUTIONS_SPREADSHEET_ID!);
};

// run on demand, as running this regularly would mean actual changes in the spreadsheet
describe.skip("appendToGSheets writes to actual Google Sheet", () => {
    it("appends a row to an actual Google Sheet", async () => {
        const body: IMessage = {
            author: "AUTOMATED UNIT TEST",
            country: "mycountry",
            text: "yeah!",
            id: "1235",
            isodate: "2021-01-01",
        };

        try {
            await systemUnderTest(body);
        } catch (error) {
            fail(error);
        }
    });

    it("works and escapes dangerous characters", async () => {
        const body: IMessage = {
            author: "+1+2",
            country: "=TODAY()",
            text: "yeah!",
            id: "1235",
            isodate: "2021-01-01",
        };

        try {
            await systemUnderTest(body);
        } catch (error) {
            fail(error);
        }
    });
});
