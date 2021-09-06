import { FailedParsing } from "./custom.error";

export const parse = <T>(stringifiedObj: string): T => {
    try {
        return JSON.parse(stringifiedObj);
    } catch (error) {
        throw new FailedParsing(stringifiedObj);
    }
};
