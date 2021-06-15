import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";
import hmacSHA512 from "crypto-js/hmac-sha512";
import { assertEnvVar } from "../validation/assert";

export const hash = (text: string, length = 32, env = process.env) => {
    assertEnvVar(env.HASH_PASSWORD, "HASH_PASSWORD");
    return hmacSHA512(text, env.HASH_PASSWORD)
        .toString()
        .slice(0, length);
};

export const encrypt = (clearText: string, env = process.env) => {
    const pw = usePw(env);
    return AES.encrypt(clearText, pw).toString();
};

export const decrypt = (cipherText: string, env = process.env) => {
    const pw = usePw(env);
    return AES.decrypt(cipherText, pw).toString(encUtf8);
};

const usePw = (env = process.env) => {
    const pw = env.SYMMETRIC_ENCRYPTION_KEY;
    assertEnvVar(pw, "SYMMETRIC_ENCRYPTION_KEY");
    return pw;
};
