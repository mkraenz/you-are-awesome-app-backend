import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { fetchCronJobs } from "../src/cron/fetchCronJobs";
import { decrypt } from "../src/util/crypto";
import { parse } from "../src/utils/parse";

dotenv.config();

const main = async () => {
    const cronjobs = await fetchCronJobs();
    const dataForSubscribeApiCalls = cronjobs.map(j => {
        const encryptedToken = parse<{ token: string }>(
            j.http_message_body
        ).token;
        const token = decrypt(encryptedToken);
        const [minute, hour] = j.cron_expression
            .split(" ")
            .slice(0, 2)
            .map(n => Number.parseInt(n, 10));
        return {
            minute,
            hour,
            token,
        };
    });
    writeFileSync(
        "./output.txt",
        dataForSubscribeApiCalls.map(d => JSON.stringify(d)).join("\n")
    );
    console.log(dataForSubscribeApiCalls);
};
main();
