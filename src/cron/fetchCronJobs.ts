import axios from "axios";
import { assertCronSuccess, ResBody } from "./assertSuccess";
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
    const easyCronApiToken = env.EASY_CRON_API_TOKEN;
    const res = await axios.get<ResBody & { cron_jobs: ICronJob[] }>(
        `https://www.easycron.com/rest/list?token=${easyCronApiToken}&sortby=name`
    );
    assertCronSuccess(res, "Get");
    return res.data.cron_jobs;
};
