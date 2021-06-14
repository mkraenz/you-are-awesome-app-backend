import fetch from "node-fetch";
import { ICronJob } from "./ICronJob";

/** @returns cronJobId from easycron */
export const fetchCronJobs = async (
    env: {
        EASY_CRON_API_TOKEN?: string;
        CRON_JOB_NAME_PREFIX?: string;
    } = process.env
) => {
    // for an example response from easyCron api, see example-response-from-get-cronjobs.http
    if (!env.EASY_CRON_API_TOKEN || !env.CRON_JOB_NAME_PREFIX) {
        throw new Error("Missing environment variable");
    }
    const easyCronApiToken = encodeURIComponent(env.EASY_CRON_API_TOKEN);
    const response = await fetch(
        `https://www.easycron.com/rest/list?token=${easyCronApiToken}&sortby=name`
    );
    const body: {
        status: string;
        cron_jobs: ICronJob[];
    } = await response.json();
    if (response.status !== 200 || body.status !== "success") {
        throw new Error(
            `Get cron failed.  HTTP status ${
                response.status
            }. Response body from easycron: ${JSON.stringify(body)}`
        );
    }
    return body.cron_jobs;
};
