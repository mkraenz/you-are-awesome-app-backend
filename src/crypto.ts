import crypto from "crypto-js";

export const hash = (text: string, length = 32, env = process.env) => {
    if (!env.HASH_PASSWORD) {
        throw new Error("Missing env var: HASH_PASSWORD");
    }
    return crypto
        .SHA512(text, env.HASH_PASSWORD)
        .toString()
        .slice(0, length);
};

export const encrypt = (clearText: string, env = process.env) => {
    const pw = usePw(env);
    return crypto.AES.encrypt(clearText, pw).toString();
};

export const decrypt = (cipherText: string, env = process.env) => {
    const pw = usePw(env);
    return crypto.AES.decrypt(cipherText, pw).toString(crypto.enc.Utf8);
};

const usePw = (env = process.env) => {
    const pw = env.PASSWORD;
    if (!pw) {
        throw new Error("Missing env var: PASSWORD");
    }
    return pw;
};
