import {
    ExpoPushErrorReceipt,
    ExpoPushErrorTicket,
    ExpoPushSuccessReceipt,
} from "expo-server-sdk";

export interface SuccessTicket {
    type: "SuccessTicket";
    expoPushToken: string;
    receiptId: string;
    uuid: string;
    timestamp: string;
}

export interface ErrorTicket extends ExpoPushErrorTicket {
    type: "ErrorTicket";
    uuid: string;
    expoPushToken: string;
    timestamp: string;
    __debug?: never;
}

export interface SuccessReceipt extends ExpoPushSuccessReceipt {
    ticketUuid: string;
    receiptId: string;
}

export interface ErrorReceipt extends ExpoPushErrorReceipt {
    ticketUuid: string;
    receiptId: string;
    expoPushToken: string;
}

export type DeviceNotRegistered = ErrorReceipt & {
    details: {
        error: "DeviceNotRegistered";
    };
};
