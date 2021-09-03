import { matchers } from "jest-json-schema";
import schema from "../../src/report-inappropriate/schema.json";

expect.extend(matchers);

const jestCompatibleSchema = {
    ...schema,
    $schema: "http://json-schema.org/draft-07/schema#",
};

it("validates", () => {
    expect({
        messageId: "message-1234",
        reason: "my-reason",
        comment: "my-optional-comment",
    }).toMatchSchema(jestCompatibleSchema);
});

it("validates without comment", () => {
    expect({
        messageId: "message-1234",
        reason: "my-reason",
    }).toMatchSchema(jestCompatibleSchema);
});

it("invalidates on missing messageId", () => {
    expect({
        reason: "my-reason",
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates on missing reason", () => {
    expect({
        messageId: "message-1234",
    }).not.toMatchSchema(jestCompatibleSchema);
});
