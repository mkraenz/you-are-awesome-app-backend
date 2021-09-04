import axios from "axios";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { parse } from "../src/utils/parse";

dotenv.config();

interface SubscribeParams {
    minute: number;
    hour: number;
    token: string;
}

const main = async () => {
    const file = readFileSync("./output.txt", "utf8");
    for (const line of file.split("\n")) {
        console.log("processing line:", JSON.stringify(line));
        const params = parse<SubscribeParams>(line);
        console.log({
            token: params.token,
            minute: params.minute,
            hour: params.hour,
        });
        await axios.put(process.env.SUBSCRIBE_URL, params, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log("finished line:", JSON.stringify(line));
    }
};
main();
