import { internet } from "faker";
import { random, range, uniq } from "lodash";
import { decrypt, encrypt, hash } from "../src/util/crypto";

it("decrypt after encrypt should yield the same result | deterministic", () => {
    const env = {
        PASSWORD: "secret",
        SYMMETRIC_ENCRYPTION_KEY: "asdf",
    };
    const clearText = "hello there";

    const cipherText = encrypt(clearText, env);
    const decipheredText = decrypt(cipherText, env);

    expect(clearText).toBe(decipheredText);
});

it("decrypt after encrypt should yield the same result", () => {
    range(0, 100).forEach(_ => {
        const randomPw = internet.password(random(10, 20), false, /[0-9A-Z]/);
        const env = {
            PASSWORD: randomPw,
            SYMMETRIC_ENCRYPTION_KEY: "asdf",
        };
        const randomStr = internet.password(random(50, 100), false, /[0-9A-Z]/);
        const clearText = randomStr;

        const cipherText = encrypt(clearText, env);
        const decipheredText = decrypt(cipherText, env);

        expect(clearText).toBe(decipheredText);
    });
});

it("encrypt is NOT deterministic", () => {
    // this caused some trouble first but eventually led to an even more secure implementation
    const env = {
        PASSWORD: "secret",
        SYMMETRIC_ENCRYPTION_KEY: "asdf",
    };
    const clearText = "hello there";

    const encrypted1 = encrypt(clearText, env);
    const encrypted2 = encrypt(clearText, env);

    expect(encrypted1).not.toEqual(encrypted2);
});

it("hash is determinisitic", () => {
    const env = {
        HASH_PASSWORD: "secret",
    };
    const clearText = "hello there";

    const hashed1 = hash(clearText, 32, env);
    const hashed2 = hash(clearText, 32, env);

    expect(hashed1).toBe(hashed2);
});

it("hash is a string of length 128 | deterministic", () => {
    const env = {
        HASH_PASSWORD: "secret",
    };
    const clearText = "hello there";

    const hashed = hash(clearText, 32, env);

    expect(typeof hashed).toBe("string");
    expect(hashed.length).toBe(32);
});

it("hash is a string of length 128 | randomized", () => {
    range(0, 100).forEach(_ => {
        const randomPw = internet.password(random(10, 20), false, /[0-9A-Z]/);
        const env = {
            HASH_PASSWORD: randomPw,
        };
        const randomStr = internet.password(random(50, 100), false, /[0-9A-Z]/);
        const clearText = randomStr;

        const hashed = hash(clearText, 32, env);

        expect(typeof hashed).toBe("string");
        expect(hashed.length).toBe(32);
    });
});

it("1000 different freetexts have different first 32 chars after hashing", () => {
    const amount = 1000;
    const randomPw = internet.password(random(10, 20), false, /[0-9A-Z]/);
    const env = {
        HASH_PASSWORD: randomPw,
    };
    const hashes = range(0, amount).map(_ => {
        const clearText = internet.password(32, false, /[0-9A-Z]/);
        return hash(clearText, 32, env);
    });
    expect(uniq(hashes).length).toBe(amount);
});
