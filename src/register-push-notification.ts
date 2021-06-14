import { addCron } from "./cron/addCron";
import { editCronJob } from "./cron/editCronJob";
import { fetchCronJobs } from "./cron/fetchCronJobs";
import { findCronJobByToken } from "./cron/findCronJobByToken";
import { isCronTime } from "./cron/isCrontime";
import { encrypt, hash } from "./crypto";
import { respond } from "./utils/respond";

export async function handler(
    // TODO: event is external so we cannot control it's shape => validate at runtime too
    event: { body: string; httpMethod: "POST" },
    context: never,
    callback: Function
) {
    try {
        const body: {
            token: string;
            hour: number;
            minute: number;
        } = JSON.parse(event.body);
        const crontime = `${body.minute} ${body.hour} * * *`; // daily at hh:mm
        if (!isCronTime(crontime)) {
            throw new Error("hour:minute do not form a valid time.");
        }
        const hashedToken = hash(body.token);
        const encryptedToken = encrypt(body.token);
        const wantedCronJob = await checkExistence(hashedToken);
        const cronJobId = wantedCronJob
            ? await editCronJob(wantedCronJob.cron_job_id, crontime)
            : await addCron(hashedToken, encryptedToken, crontime);
        const resBodyObj = { message: "Success", cronJobId };
        return respond(200, resBodyObj);
    } catch (error) {
        console.error(error);
        return respond(500, error);
    }
}

const checkExistence = async (token: string) => {
    const cronJobs = await fetchCronJobs();
    return findCronJobByToken(token, cronJobs);
};
