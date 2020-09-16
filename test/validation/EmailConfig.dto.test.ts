import { AwaitedReturnType } from "../../src/utils/AwaitedReturnType";
import { getEmailConfig } from "../../src/validation/EmailConfig.dto";

describe("getEmailConfig()", () => {
    it("returns the config on valid env", async () => {
        const env: Parameters<typeof getEmailConfig>[0] = {
            SMTP_HOST: "smtp@example.com",
            SMTP_PORT: "465",
            SMTP_PASSWORD: "super-secret-pw",
            SMTP_USERNAME: "webmaster@example.com",
            SMTP_USE_SSL: "true",
            TO_EMAILS_CSV: "receiver1@example.com, receiver2@example.com",
            FROM_ADDRESS: "noreply@example.com",
        };

        const result = await getEmailConfig(env);

        const expected: AwaitedReturnType<typeof getEmailConfig> = {
            fromAddress: "noreply@example.com",
            host: "smtp@example.com",
            port: 465,
            password: "super-secret-pw",
            user: "webmaster@example.com",
            useSsl: true,
            to: ["receiver1@example.com", "receiver2@example.com"],
        };
        expect(result).toEqual(expected);
    });

    it("throws on invalid input", async () => {
        const env: Parameters<typeof getEmailConfig>[0] = {
            SMTP_HOST: undefined,
            SMTP_PORT: "465",
            SMTP_PASSWORD: "super-secret-pw",
            SMTP_USERNAME: "webmaster@example.com",
            SMTP_USE_SSL: "true",
            TO_EMAILS_CSV: "receiver1@example.com, receiver2@example.com",
            FROM_ADDRESS: "noreply@example.com",
        };

        expect(getEmailConfig(env)).rejects.toThrow(
            "Missing env var. Required: SMTP_HOST, SMTP_PORT, SMTP_USE_SSL, SMTP_USERNAME, SMTP_PASSWORD, TO_EMAILS_CSV, FROM_ADDRESS"
        );
    });
});
