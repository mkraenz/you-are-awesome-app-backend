import { DynamoDB } from "aws-sdk";
import Expo from "expo-server-sdk";
import { chunk, partition } from "lodash";
import {
    DeviceNotRegistered,
    ErrorReceipt,
    SuccessReceipt,
    SuccessTicket,
} from "./interfaces";

const dynamoDbBulkUpdateMaxItemCount = 25;
const thirtyMinsInMs = 30 * 60 * 1000;

const cronjobNotFoundApiErrorMessage =
    "Cronjob not found. Have you registered before?";
export type TicketHandlerExpo = Pick<
    Expo,
    "chunkPushNotificationReceiptIds" | "getPushNotificationReceiptsAsync"
>;

const assert = (condition: boolean, message: string) => {
    if (!condition) {
        throw new Error(message);
    }
};

export class TicketHandler {
    constructor(
        private readonly docClient: DynamoDB.DocumentClient,
        private readonly TicketsTableName: string,
        private readonly expo: TicketHandlerExpo,
        private readonly pushNotificationCronService: {
            unregister: (expoPushToken: string) => Promise<void>;
        }
    ) {}

    public async handleSuccessTickets() {
        const allSuccessTickets = await this.getTicketsFromDb("Success");

        // there's up to 30 mins delay between the success ticket being created and the receipt being available
        const tickets = allSuccessTickets.filter(t =>
            this.isMoreThan30MinsOld(t)
        );
        console.log(
            `processing ${tickets.length} of ${allSuccessTickets.length} success tickets`
        );
        const receiptIds = tickets.map(ticket => ticket.receiptId);
        // avoid two different chunk sizes - one for expo push notifications and one for dynamodb bulkWrite
        const commonPartition = this.getCommonPartition(receiptIds);
        const ticketChunks = chunk(tickets, commonPartition);

        for (const ticketChunk of ticketChunks) {
            const { successReceipts, errorReceipts } =
                await this.getSuccessTicketReceipts(ticketChunk);
            await this.deleteSuccessTicketsFromDb(successReceipts);
            const { deviceNotRegisteredReceipts, otherErrorReceipts } =
                getErrorReceipts(errorReceipts);
            logOtherErrorReceipts(otherErrorReceipts); // TODO what to do with these
            await this.unregisterNotificationsAndDelete(
                deviceNotRegisteredReceipts
            );
        }
    }

    public async handleErrorTickets() {
        // TODO #535 ErrorTickets are like ErrorReceipts or even DeviceNotRegistered
    }

    private isMoreThan30MinsOld(ticket: SuccessTicket): unknown {
        const thirtyMinsAgo = new Date(
            new Date().getTime() - thirtyMinsInMs
        ).toISOString();
        return ticket.timestamp <= thirtyMinsAgo;
    }

    private getCommonPartition(receiptIds: string[]) {
        const receiptIdChunks =
            this.expo.chunkPushNotificationReceiptIds(receiptIds);
        const commonPartition = Math.min(
            (receiptIdChunks[0] || []).length,
            dynamoDbBulkUpdateMaxItemCount
        );
        console.log("common partition size", commonPartition);
        return commonPartition;
    }

    private async getTicketsFromDb(type: "Success" | "Error") {
        const res = await this.docClient
            .query({
                TableName: this.TicketsTableName,
                KeyConditionExpression: "#t = :t",
                ExpressionAttributeNames: {
                    "#t": "type",
                },
                ExpressionAttributeValues: {
                    ":t": `${type}Ticket`,
                },
            })
            .promise();
        return (res.Items || []) as SuccessTicket[];
    }

    private async getSuccessTicketReceipts(
        tickets: { receiptId: string; uuid: string; expoPushToken: string }[]
    ) {
        try {
            const receiptIds = tickets.map(t => t.receiptId);
            const receipts = await this.expo.getPushNotificationReceiptsAsync(
                receiptIds
            );

            const successReceipts: SuccessReceipt[] = [];
            const errorReceipts: ErrorReceipt[] = [];
            // The receipts specify whether Apple or Google successfully received the
            // notification and information about an error, if one occurred.
            for (const { receiptId, uuid, expoPushToken } of tickets) {
                const receipt = receipts[receiptId];
                if (!receipt)
                    throw new Error(
                        `Mismatch between receipts and tickets. Cannot find receipt for receipt id ${receiptId}, ticket uuid ${uuid}. Why did Expo not return the receipt?`
                    );
                if (receipt.status === "ok") {
                    successReceipts.push({
                        ...receipt,
                        receiptId,
                        ticketUuid: uuid,
                    });
                } else {
                    errorReceipts.push({
                        ...receipt,
                        receiptId,
                        ticketUuid: uuid,
                        expoPushToken,
                    });
                }
            }
            console.log({
                successReceiptsLength: successReceipts.length,
                errorReceiptsLength: errorReceipts.length,
            });
            return { successReceipts, errorReceipts };
        } catch (error) {
            console.error(
                "Error processing success ticket chunk. Skipping chunk. Affected tickets:",
                tickets
                    .map(t => `receiptId: ${t.receiptId} ticketUuid: ${t.uuid}`)
                    .join(" | "),
                "\n",
                error
            );
            return { successReceipts: [], errorReceipts: [] };
        }
    }

    private async deleteSuccessTicketsFromDb(
        receiptsChunk: { ticketUuid: string }[]
    ) {
        assert(
            receiptsChunk.length <= dynamoDbBulkUpdateMaxItemCount,
            "Too many tickets"
        );
        // ignoring empty to avoid ValidationException: The batch write request list for a table cannot be null or empty: JestTicketHandlerTes
        if (receiptsChunk.length === 0) return;
        await this.docClient
            .batchWrite({
                RequestItems: {
                    [this.TicketsTableName]: receiptsChunk.map(
                        ({ ticketUuid }) => ({
                            DeleteRequest: {
                                Key: {
                                    type: "SuccessTicket",
                                    uuid: ticketUuid,
                                },
                            },
                        })
                    ),
                },
            })
            .promise();
        console.log(
            `Deleted success tickets ${receiptsChunk
                .map(r => r.ticketUuid)
                .join(", ")}`
        );
    }

    private async unregisterNotificationsAndDelete(
        receiptsChunk: DeviceNotRegistered[]
    ) {
        assert(
            receiptsChunk.length <= dynamoDbBulkUpdateMaxItemCount,
            "Too many tickets"
        );
        const successfulUnregistrations = await this.unregisterNotifications(
            receiptsChunk
        );
        // TODO #535 with successful unregistrations deleted only, all the failed unregistrations come again tomorrow. what do we do with them :/
        await this.deleteSuccessTicketsFromDb(successfulUnregistrations);
    }

    private async unregisterNotifications<T extends { expoPushToken: string }>(
        receipts: T[]
    ) {
        const successfulUnregistrations = [];
        for (const receipt of receipts) {
            try {
                await this.pushNotificationCronService.unregister(
                    receipt.expoPushToken
                );
                successfulUnregistrations.push(receipt);
            } catch (error) {
                const notRegisteredInEasycron = error.message.includes(
                    cronjobNotFoundApiErrorMessage
                );
                if (notRegisteredInEasycron) {
                    // already unregistered -> counts as success
                    successfulUnregistrations.push(receipt);
                } else {
                    console.error(
                        `Failed to unregister expoPushToken ${receipt.expoPushToken} from easycron. Skipping deletion from database`,
                        error
                    );
                }
            }
        }
        return successfulUnregistrations;
    }
}

const getErrorReceipts = (receipts: ErrorReceipt[]) => {
    const [deviceNotRegisteredReceipts, otherErrorReceipts] = partition(
        receipts,
        receipt => receipt.details?.error === "DeviceNotRegistered"
    );
    return {
        deviceNotRegisteredReceipts:
            deviceNotRegisteredReceipts as DeviceNotRegistered[],
        otherErrorReceipts,
    };
};

const logOtherErrorReceipts = (otherErrorReceipts: ErrorReceipt[]) => {
    otherErrorReceipts.forEach(error => {
        console.error("Found other error receipt", error);
    });
};
