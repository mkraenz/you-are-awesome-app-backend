import fetch, { Response } from "node-fetch";
import { assertEnvVar } from "../validation/assert";

export const deleteCronJob = async (
    id: string,
    env: {
        EASY_CRON_API_TOKEN?: string;
    } = process.env
) => {
    assertEnvVar(env.EASY_CRON_API_TOKEN, "EASY_CRON_API_TOKEN");
    const easyCronApiToken = encodeURIComponent(env.EASY_CRON_API_TOKEN!);
    const response = await fetch(
        `https://www.easycron.com/rest/delete?token=${easyCronApiToken}&id=${id}`
    );
    await assertSuccess(response);
};

async function assertSuccess(response: Response) {
    const body: {
        status: string;
    } = await response.json();
    if (response.status !== 200 || body.status !== "success") {
        throw new Error(
            `Delete cron failed. HTTP status ${
                response.status
            }. Response body from easycron: ${JSON.stringify(body)}`
        );
    }
}
