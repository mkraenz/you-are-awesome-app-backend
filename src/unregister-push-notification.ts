import { Handler } from "aws-lambda";
import { pick } from "lodash";
import { deleteCronJob } from "./cron/deleteCronJob";
import { fetchCronJobs } from "./cron/fetchCronJobs";
import { findCronJobByToken } from "./cron/findCronJobByToken";
import { hash } from "./util/crypto";
import { respond } from "./utils/respond";
import { assertToken } from "./validation/assert";

export const handler: Handler<{ body: string; httpMethod: "POST" }> = async (
    event,
    context,
    callback
) => {
    try {
        const {
            token,
        }: {
            token: string;
        } = JSON.parse(event.body);
        assertToken(token);
        const hashedToken = hash(token);
        const wantedCronJob = await deleteIfExists(hashedToken);
        const resBody = {
            message: "Success",
            deletedCronJob: pick(wantedCronJob, [
                "cron_job_id",
                "cron_job_name",
            ]),
        };
        return respond(200, resBody);
    } catch (error) {
        console.error(error);
        return respond(500, error);
    }
};

const deleteIfExists = async (hashedToken: string) => {
    const cronJobs = await fetchCronJobs();
    const wantedCronJob = findCronJobByToken(hashedToken, cronJobs);
    if (!wantedCronJob) {
        throw new Error(
            "Cannot register. Cronjob not found. Have you registered before?"
        );
    }
    await deleteCronJob(wantedCronJob.cron_job_id);
    return wantedCronJob;
};
