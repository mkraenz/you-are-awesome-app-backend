import { auth, sheets_v4 } from "@googleapis/sheets";
import { IMessage } from "./IMessage";

export const setupGoogleAuth = (cfg: { privateKey: string; email: string }) =>
    new auth.JWT(cfg.email, undefined, cfg.privateKey, [
        "https://www.googleapis.com/auth/spreadsheets",
    ]);

type JWT = ReturnType<typeof setupGoogleAuth>;

export async function appendToGSheets(
    body: IMessage,
    auth: JWT,
    spreadsheetId: string
) {
    const row = toRow(body);
    await appendRow(auth, spreadsheetId, row);
    console.log(
        `Successfully appended row to gsheet. Row: ${JSON.stringify(row)}`
    );
}

const toRow = (body: IMessage) =>
    [
        body.id,
        body.isodate,
        body.text,
        body.author,
        body.country,
        new Date().toISOString(),
    ].map(escape);

const escape = (str: string) => (["=", "+"].includes(str[0]) ? `'${str}` : str);

/** row headers: id	timestamp text author country timestamp */
export async function appendRow(
    auth: JWT,
    spreadsheetId: string,
    row: string[]
) {
    const gsheets = new sheets_v4.Sheets({ auth });
    // axios request -> throws on 4xx or 5xx http status code
    await gsheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        valueInputOption: "USER_ENTERED",
        range: "Sheet 1",
        requestBody: {
            values: [row],
        },
        includeValuesInResponse: true,
    });
}
