import { Handler } from "aws-lambda";
import Axios from "axios";
import csvTojson from "csvtojson";
import { respond } from "../utils/respond";
import { assertEnvVar } from "../validation/assert";

export const handler: Handler<{
    httpMethod: "GET";
}> = async () => {
    try {
        const spreadsheetPublicId = process.env.MESSAGES_SPREADSHEET_PUBLIC_ID;
        assertEnvVar(spreadsheetPublicId, "MESSAGES_SPREADSHEET_PUBLIC_ID");
        const spreadsheetAsCsv = await fetchSpreadsheetData(
            spreadsheetPublicId
        );
        const spreadsheetAsJson = await csvTojson({
            trim: true,
        }).fromString(spreadsheetAsCsv);
        console.log({ returnedNumOfRows: spreadsheetAsJson.length });
        return respond(200, { rows: spreadsheetAsJson });
    } catch (error) {
        return respond(500, error);
    }
};

const fetchSpreadsheetData = async (spreadsheetPublicId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/e/${spreadsheetPublicId}/pub?gid=0&single=true&output=csv`;
    const res = await Axios.get<string>(url);
    return res.data;
};
