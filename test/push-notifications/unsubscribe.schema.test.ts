import { matchers } from "jest-json-schema";
import schema from "../../src/push-notifications/unsubscribe.schema.json";

expect.extend(matchers);

const jestCompatibleSchema = {
    ...schema,
    $schema: "http://json-schema.org/draft-07/schema#",
};

it("validates ExponentPushToken", () => {
    expect({ token: "ExponentPushToken[12345]" }).toMatchSchema(
        jestCompatibleSchema
    );
});

it("validates ExpoPushToken", () => {
    expect({ token: "ExpoPushToken[12345]" }).toMatchSchema(
        jestCompatibleSchema
    );
});

it("invalidates non-matching tokens", () => {
    const invalidTokens = [
        "ExpoPushToken12345]",
        "ExpoPushToken[12345",
        "ExponentPushToken12345]",
        "ExponentPushToken[12345",
        "bla",
        "",
        "123",
        23,
        true,
        false,
        null,
        undefined,
    ];
    invalidTokens.forEach(token => {
        expect({ token }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates push token with empty square brackets", () => {
    expect({
        token: "ExponentPushToken[]",
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing token", () => {
    expect({}).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing token", () => {
    expect(undefined).not.toMatchSchema(jestCompatibleSchema);
});
