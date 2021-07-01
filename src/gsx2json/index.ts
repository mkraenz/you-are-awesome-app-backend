import { Handler } from "aws-lambda";
import Axios from "axios";
import { respond } from "../utils/respond";
import { googleSheetToJson } from "./googleSheetToJson";
import { IQueryParams } from "./IQueryParams";

export const handler: Handler<{
    queryStringParameters?: IQueryParams;
    httpMethod: "GET";
}> = async (event, context, callback) => {
    let options: ReturnType<typeof getOptions>;
    try {
        options = getOptions(event.queryStringParameters);
    } catch (error) {
        return respond(400, error);
    }
    try {
        const spreadsheetData = await fetchSpreadsheetData(options);
        const spreadsheetDataAsJson = googleSheetToJson(
            options,
            spreadsheetData
        );
        return respond(200, spreadsheetDataAsJson);
    } catch (error) {
        return respond(500, error);
    }
};

const fetchSpreadsheetData = async ({
    id,
    sheet,
}: {
    id: string;
    sheet: number;
}) => {
    const url = `https://spreadsheets.google.com/feeds/list/${id}/${sheet}/public/values?alt=json`;
    const res = await Axios.get<{ feed: { entry: any } }>(url);
    return res.data;
};

const getOptions = (
    params?: IQueryParams
): {
    id: string;
    sheet: number;
    query: string;
    useIntegers: boolean;
    showRows: boolean;
    showColumns: boolean;
} => {
    if (!params || !params.id)
        throw new Error("id query parameter must be provided");
    const id = params.id;
    const sheet = Number.parseInt(params.sheet || "1", 10) || 1;
    const query = params.q || "";
    const useIntegers = params.integers ? !(params.integers === "false") : true;
    const showRows = params.rows ? !(params.rows === "false") : true;
    const showColumns = params.columns ? !(params.columns === "false") : true;
    if (!showRows && !showColumns) {
        throw new Error(
            "Do not set BOTH rows=false and columns=false at the same time"
        );
    }
    return {
        id,
        sheet,
        query,
        useIntegers,
        showRows,
        showColumns,
    };
};
