export interface ICronJob {
    cron_job_id: string;
    cron_job_name: string;
    /** stringified {token: string} */
    http_message_body: string;
    /** example: '0 9 * * *' for 09:00 */
    cron_expression: string;
}
