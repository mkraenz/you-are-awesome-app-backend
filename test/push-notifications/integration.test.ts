import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import axios from "axios";
import MockDate from "mockdate";
import { AwesomeMessagesService } from "../../src/push-notifications/AwesomeMessagesService";
import { DeviceNotRegisteredHandler } from "../../src/push-notifications/DeviceNotRegisteredHandler";
import { ExpoReceiptAdapter } from "../../src/push-notifications/ExpoReceiptsAdapter";
import { ExpoSendAdapter } from "../../src/push-notifications/ExpoSendAdapter";
import { Sender } from "../../src/push-notifications/Sender";
import { SubscriptionRepository } from "../../src/push-notifications/SubscriptionRepository";
import { TicketExchange } from "../../src/push-notifications/TicketExchange";
import { TicketRepository } from "../../src/push-notifications/TicketRepository";
import { mockLogger } from "../../src/util/ILogger";
import {
    createGsiSubsByTime,
    createSubsTable,
    createTicketsTable,
    dropTable,
} from "../createTable.learning";

const SubsTable = "PushNotifsIntegrationSubs";
const SubsByTimeIndex = "PushNotifsIntegrationSubsByTime";
const TicketsTable = "PushNotifsIntegrationTickets";
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: "us-west-1",
    endpoint: "http://localhost:7999",
};
const awesomeMessagesInS3 = [
    {
        id: "1a",
        isodate: "2019-12-31",
        text: "You are perfect!",
        author: "Phil",
        country: "United States",
    },
    {
        id: "2a",
        isodate: "2020-01-01",
        text: "You look beautiful today.",
        author: "Jessi",
        country: "Canada",
    },
];

const dynamodb = new AWS.DynamoDB(serviceConfigOptions);

let subs: SubscriptionRepository;
let tickets: TicketRepository;

beforeEach(async () => {
    await createSubsTable(dynamodb, SubsTable);
    await createGsiSubsByTime(dynamodb, SubsTable, SubsByTimeIndex);
    await createTicketsTable(dynamodb, TicketsTable);

    const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);
    subs = new SubscriptionRepository(
        docClient,
        SubsTable,
        SubsByTimeIndex,
        mockLogger
    );
    tickets = new TicketRepository(docClient, TicketsTable, mockLogger);
});

afterEach(async () => {
    MockDate.reset();
    await dropTable(dynamodb, SubsTable);
    await dropTable(dynamodb, TicketsTable);
});

it("Happy Path: subscribe > send notification > exchange success ticket for success receipt > Expect: deleted ticket", async () => {
    MockDate.set("2020-01-01T13:30:00.000Z");
    const expoPushToken = "ExpoPushToken[happypath]";
    const time = "13:37";
    const expoSend = new ExpoSendAdapter({
        chunkPushNotifications: messages => [messages],
        sendPushNotificationsAsync: async messages => [
            {
                status: "ok",
                id: "raw-expo-receipt-id-1",
            },
        ],
    });
    jest.spyOn(axios, "get").mockResolvedValue({ data: awesomeMessagesInS3 });
    const awesomeMessages = new AwesomeMessagesService("some-url");
    const sender = new Sender(
        subs,
        expoSend,
        awesomeMessages,
        tickets,
        mockLogger
    );
    const expoReceipts = new ExpoReceiptAdapter({
        chunkPushNotificationReceiptIds: receipts => [receipts],
        getPushNotificationReceiptsAsync: async receiptIds => ({
            [receiptIds[0]]: { status: "ok" },
        }),
    });
    const ticketExchange = new TicketExchange(
        tickets,
        expoReceipts,
        mockLogger
    );

    await subs.put(expoPushToken, time); // subscribe
    await sender.send("13:37"); // send notification
    MockDate.set("2020-01-01T14:01:00.000Z"); // 30 mins must pass
    await ticketExchange.handleSuccessTickets(); // exchange success ticket for success receipt and delete ticket

    expect(await tickets.getSuccessTickets()).toEqual([]);
});

it("DeviceNotRegistered Path: subscribe > send notification > exchange success ticket for error receipt > handle device not registered > Expect: deleted sub and ticket", async () => {
    MockDate.set("2020-01-01T13:30:00.000Z");
    const expoPushToken = "ExpoPushToken[DeviceNotRegisteredPath]";
    const time = "13:37";
    const expoSend = new ExpoSendAdapter({
        chunkPushNotifications: messages => [messages],
        sendPushNotificationsAsync: async messages => [
            {
                status: "ok",
                id: "raw-expo-receipt-id-1",
            },
        ],
    });
    jest.spyOn(axios, "get").mockResolvedValue({ data: awesomeMessagesInS3 });
    const awesomeMessages = new AwesomeMessagesService("some-url");
    const sender = new Sender(
        subs,
        expoSend,
        awesomeMessages,
        tickets,
        mockLogger
    );
    const expoReceipts = new ExpoReceiptAdapter({
        chunkPushNotificationReceiptIds: receipts => [receipts],
        getPushNotificationReceiptsAsync: async receiptIds => ({
            [receiptIds[0]]: {
                status: "error",
                message:
                    '\\"ExponentPushToken[DeviceNotRegisteredPath]\\" is not a registered push notification recipient',
                details: { error: "DeviceNotRegistered" },
            },
        }),
    });
    const ticketExchange = new TicketExchange(
        tickets,
        expoReceipts,
        mockLogger
    );
    const deviceNotRegisteredHandler = new DeviceNotRegisteredHandler(
        tickets,
        subs,
        mockLogger
    );

    await subs.put(expoPushToken, time); // subscribe
    expect(await subs.get(expoPushToken)).toBeDefined();
    await sender.send("13:37"); // send notification
    MockDate.set("2020-01-01T14:01:00.000Z"); // 30 mins must pass
    await ticketExchange.handleSuccessTickets(); // exchange success ticket for error receipt, deletes ticket, writes receipt
    await deviceNotRegisteredHandler.unsubscribeAffectedExpoPushTokens();

    expect(await tickets.getMany("DeviceNotRegisteredReceipt")).toEqual([]);
    await expect(subs.get(expoPushToken)).rejects.toThrow(
        /No subscription found/
    );
});
