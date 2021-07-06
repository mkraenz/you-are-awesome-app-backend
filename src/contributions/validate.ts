import { isEmpty, omit } from "lodash";
import { InvalidArgument } from "../util/custom.error";
import { IMessage } from "./IMessage";

export function assertMessage(body: unknown): asserts body is IMessage {
    if (!body) {
        throw new InvalidArgument("Missing body");
    }
    if (typeof body !== "object") {
        throw new InvalidArgument("body must an object.");
    }
    const body_ = isIMessage(body as { [key: string]: any });
    assertUUID(body_);
    assertDateString(body_);
}

const isIMessage = (x: { [key: string]: any }): IMessage => {
    const assertKey = assertDefinedKey(x);
    const keys: (keyof IMessage)[] = [
        "author",
        "country",
        "id",
        "isodate",
        "text",
    ];
    keys.forEach(assertKey);
    assertNoOtherKeys(x as IMessage, keys);
    return x as IMessage;
};

const assertDefinedKey =
    (body: { [akey: string]: any }) => (key: keyof IMessage) => {
        if (typeof body[key] !== "string" || !body[key]) {
            throw new InvalidArgument(
                `Body malformed. Received ${JSON.stringify(
                    body
                )}. Malformed key '${key}'`
            );
        }
    };

const assertNoOtherKeys = (body: IMessage, keys: (keyof IMessage)[]) => {
    if (!isEmpty(omit(body, keys))) {
        throw new InvalidArgument(
            `Body malformed. Unnecessary keys found. Received ${JSON.stringify(
                body
            )}. Expected keys ${JSON.stringify(keys)}`
        );
    }
};

const assertUUID = (body: IMessage) => {
    const v4 = new RegExp(
        /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    );
    if (!v4.test(body.id)) {
        throw new InvalidArgument(
            `Body malformed. id is not a UUID v4. Received ${JSON.stringify(
                body
            )}.`
        );
    }
};

const assertDateString = (body: IMessage) => {
    const isIsodate = body.isodate.match(/^\d{4}-\d{2}-\d{2}/);
    if (!isIsodate) {
        throw new InvalidArgument(
            `Body malformed. isodate malformed. Received ${JSON.stringify(
                body
            )}.`
        );
    }
};
