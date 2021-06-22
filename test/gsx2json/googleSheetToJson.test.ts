import { googleSheetToJson } from "../../src/gsx2json/googleSheetToJson";

it("formats the rows of a the data returned from google spreadsheets API into a JSON", () => {
    const options = {
        query: "",
        showColumns: false,
        showRows: true,
        useIntegers: true,
    };
    const spreadsheetData = {
        feed: {
            entry: [
                {
                    id: {
                        $t: "https://spreadsheets.google.com/feeds/list/somespreadsheetid/1/public/values/cokwr",
                    },
                    updated: { $t: "2021-06-22T20:59:15.578Z" },
                    category: [[Object]],
                    title: { type: "text", $t: "1a" },
                    content: {
                        type: "text",
                        $t: "isodate: 2019-10-17, text: You are perfect!, author: Phil, country: United States",
                    },
                    link: [[Object]],
                    gsx$id: { $t: "1a" },
                    gsx$isodate: { $t: "2019-10-17" },
                    gsx$text: { $t: "You are perfect!" },
                    gsx$author: { $t: "Phil" },
                    gsx$country: { $t: "United States" },
                    gsx$tweeted: { $t: "" },
                },
                {
                    id: {
                        $t: "https://spreadsheets.google.com/feeds/list/somespreadsheetid/1/public/values/cpzh4",
                    },
                    updated: { $t: "2021-06-22T20:59:15.578Z" },
                    category: [[Object]],
                    title: { type: "text", $t: "2a" },
                    content: {
                        type: "text",
                        $t: "isodate: 2019-10-18, text: You look beautiful today., author: Jessi, country: Canada",
                    },
                    link: [[Object]],
                    gsx$id: { $t: "2a" },
                    gsx$isodate: { $t: "2019-10-18" },
                    gsx$text: { $t: "You look beautiful today." },
                    gsx$author: { $t: "Jessi" },
                    gsx$country: { $t: "Canada" },
                    gsx$tweeted: { $t: "" },
                },
            ],
        },
    };

    const encrypted1 = googleSheetToJson(options, spreadsheetData);

    const expected: ReturnType<typeof googleSheetToJson> = {
        rows: [
            {
                id: "1a",
                isodate: "2019-10-17",
                text: "You are perfect!",
                author: "Phil",
                country: "United States",
                tweeted: 0,
            },
            {
                id: "2a",
                isodate: "2019-10-18",
                text: "You look beautiful today.",
                author: "Jessi",
                country: "Canada",
                tweeted: 0,
            },
        ],
    };
    expect(encrypted1).toEqual(expected);
});
