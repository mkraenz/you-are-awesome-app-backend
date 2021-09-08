import { Expo } from "expo-server-sdk";
import { InvalidArgument, MissingEnvironmentVariable } from "./custom.error";
export const assertToken = (expoPushToken: string) => {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        throw new InvalidArgument(
            `Not a valid expo push token. Got ${JSON.stringify(expoPushToken)}`
        );
    }
};

export function assertEnvVar(
    value: string | undefined,
    name: string
): asserts value is string {
    if (!value) {
        throw new MissingEnvironmentVariable(name);
    }
}

export const assertByteSizeBelow = (
    limit: number,
    obj: { [key: string]: any }
): void => {
    const messageSize = Buffer.byteLength(JSON.stringify(obj), "utf8");
    if (messageSize > limit) {
        throw new Error(
            `Message size is ${messageSize} bytes. Limit is ${limit} bytes.`
        );
    }
};
