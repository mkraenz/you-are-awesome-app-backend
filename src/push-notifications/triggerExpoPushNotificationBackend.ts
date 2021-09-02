import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { assertToken } from "../validation/assert";

// see https://github.com/expo/expo-server-sdk-node
// and https://docs.expo.io/versions/latest/guides/push-notifications
export const triggerExpoPushNotificationBackend = async (
    expoPushToken: string,
    notification: { title: string; body: string }
) => {
    let expo = new Expo();
    assertToken(expoPushToken);
    const messages: ExpoPushMessage[] = [
        {
            to: expoPushToken,
            sound: "default" as const,
            body: notification.body,
            title: notification.title,
        },
    ];
    const tickets = await sendPushNotifications(expo, messages);
    const receiptIds = getSuccessReceiptIds(tickets);
    await handleReceipts(expo, receiptIds);
};

// TODO #535 handle receipts at some point - implemented in #535. After that's implemented + production data is migrated, remove this and related functions.

// Later, after the Expo push notification service has delivered the
// notifications to Apple or Google (usually quickly, but allow the the service
// up to 30 minutes when under load), a "receipt" for each notification is
// created. The receipts will be available for at least a day; stale receipts
// are deleted.
//
// The ID of each receipt is sent back in the response "ticket" for each
// notification. In summary, sending a notification produces a ticket, which
// contains a receipt ID you later use to get the receipt.
//
// The receipts may contain error codes to which you must respond. In
// particular, Apple or Google may block apps that continue to send
// notifications to devices that have blocked notifications or have uninstalled
// your app. Expo does not control this policy and sends back the feedback from
// Apple and Google so you can handle it appropriately.
const handleReceipts = async (expo: Expo, receiptIds: string[]) => {
    let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (let chunk of receiptIdChunks) {
        try {
            let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            console.log(
                `chunk: ${chunk}\nreceipts: ${JSON.stringify(receipts)}`
            );

            // The receipts specify whether Apple or Google successfully received the
            // notification and information about an error, if one occurred.
            for (let receipt of receipts as any) {
                if (receipt.status === "ok") {
                    continue;
                } else if (receipt.status === "error") {
                    console.error(
                        `There was an error sending a notification: ${receipt.message}`
                    );
                    if (receipt.details && receipt.details.error) {
                        // The error codes are listed in the Expo documentation:
                        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
                        // You must handle the errors appropriately.
                        console.error(
                            `The error code is ${receipt.details.error}`
                        );
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};

const sendPushNotifications = async (
    expo: Expo,
    messages: ExpoPushMessage[]
) => {
    let chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }
    console.log(`tickets: ${JSON.stringify(tickets)}`);
    return tickets;
};

function getSuccessReceiptIds(tickets: ExpoPushTicket[]) {
    let ids: string[] = [];
    for (let ticket of tickets) {
        if (ticket.status === "ok") {
            ids.push(ticket.id);
        }
        if (ticket.status === "error") {
            throw new Error(
                `Push ticket with status error: ${JSON.stringify(ticket)}`
            );
        }
    }
    return ids;
}
