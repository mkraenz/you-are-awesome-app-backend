import axios from "axios";
import { assertEnvVar } from "../validation/assert";
import { assertCronSuccess, ResBody } from "./assertSuccess";

/**
 * See https://www.easycron.com/document/add
 *
 * Example response from easycron add
 * {
 *  "status": "success",
 *  "cron_job_id": "2300854"
 * }
 *
 * @returns cronJobId from easycron */
export const addCron = async (
    hashedPushToken: string,
    encryptedPushToken: string,
    crontime: string,
    env: {
        PUSH_NOTIFICATIONS_BACKEND_URI?: string;
        EASY_CRON_API_TOKEN?: string;
        CRON_JOB_NAME_PREFIX?: string;
        CRON_JOB_SUFFIX_LENGTH?: string;
    } = process.env
) => {
    assertEnvVar(
        env.PUSH_NOTIFICATIONS_BACKEND_URI,
        "PUSH_NOTIFICATIONS_BACKEND_URI"
    );
    assertEnvVar(env.EASY_CRON_API_TOKEN, "EASY_CRON_API_TOKEN");
    assertEnvVar(env.CRON_JOB_NAME_PREFIX, "CRON_JOB_NAME_PREFIX");

    const cronJobName = encodeURIComponent(
        `${env.CRON_JOB_NAME_PREFIX}${hashedPushToken}`
    );
    const posts = encodeURIComponent(
        JSON.stringify({ token: encryptedPushToken })
    );
    const url = encodeURIComponent(env.PUSH_NOTIFICATIONS_BACKEND_URI!);
    const easyCronApiToken = encodeURIComponent(env.EASY_CRON_API_TOKEN!);
    const res = await axios.get<ResBody & { cron_job_id: string }>(
        `https://www.easycron.com/rest/add?token=${easyCronApiToken}&cron_expression=${crontime}&http_method=POST&posts=${posts}&url=${url}&cron_job_name=${cronJobName}`
    );
    assertCronSuccess(res, "Add");
    return res.data.cron_job_id;
};
