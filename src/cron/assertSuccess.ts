import { AxiosResponse } from "axios";

export type ResBody = { status: string };

export function assertCronSuccess(
    { status, data }: AxiosResponse<ResBody>,
    type: "Add" | "Edit" | "Delete" | "Get"
) {
    if (data.status !== "success") {
        throw new Error(
            `${type} cron failed. HTTP status ${status}. Response body from easycron: ${JSON.stringify(
                data
            )}`
        );
    }
}
