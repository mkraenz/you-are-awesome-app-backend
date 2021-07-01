import axios from "axios";
import { assertEnvVar } from "../validation/assert";
import { assertCronSuccess, ResBody } from "./assertSuccess";

export const deleteCronJob = async (
    id: string,
    env: {
        EASY_CRON_API_TOKEN?: string;
    } = process.env
) => {
    assertEnvVar(env.EASY_CRON_API_TOKEN, "EASY_CRON_API_TOKEN");
    const easyCronApiToken = encodeURIComponent(env.EASY_CRON_API_TOKEN!);
    const res = await axios.get<ResBody>(
        `https://www.easycron.com/rest/delete?token=${easyCronApiToken}&id=${id}`
    );
    assertCronSuccess(res, "Delete");
};
