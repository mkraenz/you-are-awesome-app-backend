import { addCron } from "./cron/addCron";
import { editCronJob } from "./cron/editCronJob";
import { fetchCronJobs } from "./cron/fetchCronJobs";
import { encrypt, hash } from "./crypto";
import { findCronJobByToken } from "./cron/findCronJobByToken";
import { isCronTime } from "./cron/isCrontime";

export async function handler(
    // TODO: event is external so we cannot control it's shape => validate at runtime too
    event: { body: string; httpMethod: "POST" },
    context: never,
    callback: Function
) {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const done = (err: Error | null, resBody?: object) =>
        callback(null, {
            statusCode: err ? "400" : "200",
            body: err ? err.message : JSON.stringify(resBody),
            headers: {
                "Content-Type": "application/json",
            },
        });

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
        return done(null, resBodyObj);
    } catch (error) {
        return done(error);
    }
}

const checkExistence = async (token: string) => {
    const cronJobs = await fetchCronJobs();
    return findCronJobByToken(token, cronJobs);
};
