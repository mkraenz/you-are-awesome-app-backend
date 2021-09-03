import { ExpoPushErrorTicket } from "expo-server-sdk";

export const toErrorReceiptType = (ticket: ExpoPushErrorTicket) =>
    ticket.details?.error
        ? (`${ticket.details.error}Receipt` as const)
        : ("UnknownErrorReceipt" as const);
