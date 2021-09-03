import { matchers } from "jest-json-schema";
import { range } from "lodash";
import { v4 } from "uuid";
import schema from "../../src/contributions/contributions.schema.json";

expect.extend(matchers);

const jestCompatibleSchema = {
    ...schema,
    $schema: "http://json-schema.org/draft-07/schema#",
};

it("validates", () => {
    expect({
        id: v4(),
        country: "my country",
        author: "my-author",
        isodate: "2021-10-31",
        text: "my-text",
    }).toMatchSchema(jestCompatibleSchema);
});

it("validates all dates in 2021 and some nonsensical dates", () => {
    range(1, 13).forEach(month => {
        range(1, 32).forEach(day => {
            expect({
                id: v4(),
                country: "my country",
                author: "my-author",
                isodate: `2021-${month < 10 ? `0${month}` : month}-${
                    day < 10 ? `0${day}` : day
                }`,
                text: "my-text",
            }).toMatchSchema(jestCompatibleSchema);
        });
    });
});

it("invalidates for missing text", () => {
    expect({
        id: v4(),
        country: "my country",
        author: "my-author",
        isodate: `2021-04-12`,
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates for missing isodate", () => {
    expect({
        id: v4(),
        country: "my country",
        author: "my-author",
        text: "1312",
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates for missing author", () => {
    expect({
        id: v4(),
        country: "my country",
        isodate: `2021-04-12`,
        text: "1312",
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates for missing id", () => {
    expect({
        country: "my country",
        author: "my-author",
        isodate: `2021-04-12`,
        text: "1312",
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing input", () => {
    expect(undefined).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates non v4 uuid", () => {
    const invalidIds = ["", "not-a-uuid", "5", 5, 12, null, undefined, [], {}];
    invalidIds.forEach(id => {
        expect({
            id,
            country: "my country",
            author: "my-author",
            isodate: "2021-10-31",
            text: "my-text",
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates non-string countries", () => {
    const invalidCountry = ["", 5, 12, null, undefined, [], {}];
    invalidCountry.forEach(country => {
        expect({
            id: v4(),
            country,
            author: "my-author",
            isodate: "2021-10-31",
            text: "my-text",
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates strings longer than 50 chars", () => {
    const fiftyChars = range(51)
        .map(() => "a")
        .join("");
    expect({
        id: v4(),
        country: fiftyChars,
        author: "my-author",
        isodate: "2021-10-31",
        text: "my-text",
    }).not.toMatchSchema(jestCompatibleSchema);

    const validChars = fiftyChars.substring(0, 50);
    expect({
        id: v4(),
        country: validChars,
        author: "my-author",
        isodate: "2021-10-31",
        text: "my-text",
    }).toMatchSchema(jestCompatibleSchema);
});
