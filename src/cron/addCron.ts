import fetch from "node-fetch";
import { assertEnvVar } from "../validation/assert";

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
    const response = await fetch(
        `https://www.easycron.com/rest/add?token=${easyCronApiToken}&cron_expression=${crontime}&http_method=POST&posts=${posts}&url=${url}&cron_job_name=${cronJobName}`
    );
    const body: { status: string; cron_job_id: string } = await response.json();
    if (response.status !== 200 || body.status !== "success") {
        throw new Error(
            `Add cron failed. Response body from easycron: ${JSON.stringify(
                body
            )}`
        );
    }
    return body.cron_job_id;
};
