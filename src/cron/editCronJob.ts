import fetch from "node-fetch";

/** @returns cronJobId from easycron */
export const editCronJob = async (
    id: string,
    crontime: string,
    env: {
        EASY_CRON_API_TOKEN?: string;
    } = process.env
) => {
    /**
     * See https://www.easycron.com/document/edit
     *
     * Example response from easycron add
     * {
     *  "status": "success",
     *  "cron_job_id": "2300854"
     * }
     */

    if (!env.EASY_CRON_API_TOKEN) {
        throw new Error("Missing environment variable");
    }
    const easyCronApiToken = encodeURIComponent(env.EASY_CRON_API_TOKEN);
    const response = await fetch(
        `https://www.easycron.com/rest/edit?token=${easyCronApiToken}&id=${id}&cron_expression=${crontime}`
    );
    const body: { status: string; cron_job_id: string } = await response.json();
    if (response.status !== 200 || body.status !== "success") {
        throw new Error(
            `Edit cron failed. Response body from easycron: ${JSON.stringify(
                body
            )}`
        );
    }
    return body.cron_job_id;
};
