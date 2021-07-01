import axios from "axios";
import { assertCronSuccess, ResBody } from "./assertSuccess";

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
    const res = await axios.get<ResBody & { cron_job_id: string }>(
        `https://www.easycron.com/rest/edit?token=${easyCronApiToken}&id=${id}&cron_expression=${crontime}`
    );
    assertCronSuccess(res, "Edit");
    return res.data.cron_job_id;
};
