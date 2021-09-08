import Axios from "axios";
import csvTojson from "csvtojson";

export const gsheetsToMessages = async (
    publicMessagesSpreadSheetId: string
) => {
    const spreadsheetAsCsv = await fetchSpreadsheetData(
        publicMessagesSpreadSheetId
    );
    const spreadsheetAsJson = await csvTojson({
        trim: true,
    }).fromString(spreadsheetAsCsv);
    console.log({ returnedNumOfRows: spreadsheetAsJson.length });
    return spreadsheetAsJson;
};

const fetchSpreadsheetData = async (spreadsheetPublicId: string) => {
    const url = `https://docs.google.com/spreadsheets/d/e/${spreadsheetPublicId}/pub?gid=0&single=true&output=csv`;
    const res = await Axios.get<string>(url);
    return res.data;
};
