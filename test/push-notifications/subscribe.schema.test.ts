import { matchers } from "jest-json-schema";
import { range } from "lodash";
import schema from "../../src/push-notifications/subscribe.schema.json";

expect.extend(matchers);

const jestCompatibleSchema = {
    ...schema,
    $schema: "http://json-schema.org/draft-07/schema#",
};

it("validates ExponentPushToken", () => {
    expect({
        token: "ExponentPushToken[12345]",
        hour: 19,
        minute: 38,
    }).toMatchSchema(jestCompatibleSchema);
});

it("validates ExpoPushToken", () => {
    expect({
        token: "ExpoPushToken[12345]",
        hour: 19,
        minute: 38,
    }).toMatchSchema(jestCompatibleSchema);
});

it("validates in all combination of hour and minute", () => {
    range(0, 24).forEach(hour => {
        range(0, 60).forEach(minute => {
            expect({
                token: "ExponentPushToken[12345]",
                hour,
                minute,
            }).toMatchSchema(jestCompatibleSchema);
        });
    });
});

it("invalidates if hour is >=24", () => {
    range(24, 30).forEach(hour => {
        expect({
            token: "ExponentPushToken[12345]",
            hour,
            minute: 38,
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates if hour is <0", () => {
    range(-5, 0).forEach(hour => {
        expect({
            token: "ExponentPushToken[12345]",
            hour,
            minute: 38,
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates if hour is not an integer", () => {
    range(5).forEach(_ => {
        expect({
            token: "ExponentPushToken[12345]",
            hour: Math.random(),
            minute: 38,
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates if minute is <0", () => {
    range(-5, 0).forEach(minute => {
        expect({
            token: "ExponentPushToken[12345]",
            hour: 4,
            minute,
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates if minute is not an integer", () => {
    range(5).forEach(_ => {
        expect({
            token: "ExponentPushToken[12345]",
            hour: 5,
            minute: Math.random(),
        }).not.toMatchSchema(jestCompatibleSchema);
    });
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
        expect({
            token,
            hour: 19,
            minute: 38,
        }).not.toMatchSchema(jestCompatibleSchema);
    });
});

it("invalidates push token with empty square brackets", () => {
    expect({
        token: "ExponentPushToken[]",
        hour: 19,
        minute: 38,
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing token", () => {
    expect({
        hour: 19,
        minute: 38,
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing hour", () => {
    expect({
        token: "ExponentPushToken[12345]",
        minute: 38,
    }).not.toMatchSchema(jestCompatibleSchema);
});

it("invalidates missing minute", () => {
    expect({
        token: "ExponentPushToken[12345]",
        hour: 19,
    }).not.toMatchSchema(jestCompatibleSchema);
});
