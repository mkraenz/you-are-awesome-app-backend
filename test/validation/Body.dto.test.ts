import { AwaitedReturnType } from "../../src/utils/AwaitedReturnType";
import { getBody } from "../../src/validation/Body.dto";

describe("getBody()", () => {
    it("returns the config on valid input with comment", async () => {
        const input: Parameters<typeof getBody>[0] = {
            messageId: "my-message-123",
            reason: "Invalid content",
            comment: "my-comment",
        };

        const result = await getBody(input);

        const expected: AwaitedReturnType<typeof getBody> = {
            messageId: "my-message-123",
            reason: "Invalid content",
            comment: "my-comment",
        };
        expect(result).toEqual(expected);
    });

    it("returns the config on valid input without comment", async () => {
        const input: Parameters<typeof getBody>[0] = {
            messageId: "my-message-123",
            reason: "Invalid content",
        };

        const result = await getBody(input);

        const expected: AwaitedReturnType<typeof getBody> = {
            messageId: "my-message-123",
            reason: "Invalid content",
        };
        expect(result).toEqual(expected);
    });

    it("throws on invalid input", async () => {
        const input: Parameters<typeof getBody>[0] = {
            // @ts-expect-error
            messageId: 1234,
            reason: "Invalid content",
        };

        expect(getBody(input)).rejects.toThrow(
            "Validation error on request body"
        );
    });
});
