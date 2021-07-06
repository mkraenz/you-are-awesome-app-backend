import { google } from "googleapis";
import { JWT } from "googleapis-common";
import { IMessage } from "./IMessage";

export const setupGoogleAuth = (cfg: { privateKey: string; email: string }) =>
    new google.auth.JWT(cfg.email, undefined, cfg.privateKey, [
        "https://www.googleapis.com/auth/spreadsheets",
    ]);

export async function appendToGSheets(
    body: IMessage,
    auth: JWT,
    spreadsheetId: string
) {
    // const credentials = await auth.authorize();
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
    const gsheetsService = google.sheets({ version: "v4", auth });
    // axios request -> throws on 4xx or 5xx http status code
    await gsheetsService.spreadsheets.values.append({
        spreadsheetId,
        valueInputOption: "USER_ENTERED",
        range: "Sheet 1",
        requestBody: {
            values: [row],
        },
        includeValuesInResponse: true,
    });
}
