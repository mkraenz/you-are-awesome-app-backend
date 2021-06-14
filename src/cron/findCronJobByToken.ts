import { assertEnvVar } from "../validation/assert";
import { ICronJob } from "./ICronJob";

export const findCronJobByToken = (
    hashedPushToken: string,
    cronJobs: ICronJob[],
    env: {
        CRON_JOB_NAME_PREFIX?: string;
        CRON_JOB_SUFFIX_LENGTH?: string;
    } = process.env
) => {
    assertEnvVar(env.CRON_JOB_NAME_PREFIX, "CRON_JOB_NAME_PREFIX");
    const wantedCronJobName = encodeURIComponent(
        `${env.CRON_JOB_NAME_PREFIX}${hashedPushToken}`
    );
    const wantedCronJob = cronJobs.find(
        job => job.cron_job_name === wantedCronJobName
    );

    return wantedCronJob;
};
