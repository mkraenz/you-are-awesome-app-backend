import { range } from "lodash";
import { Sender } from "../../src/push-notifications/Sender";
import { mockLogger } from "../../src/util/ILogger";

it("sends notifications and saves tickets to Tickets table", async () => {
    type SenderParams = ConstructorParameters<typeof Sender>;
    const subsRepo: SenderParams[0] = {
        getManyByTime: jest.fn(async (time: string) => {
            if (time === "17:28") {
                return [
                    {
                        expoPushToken: "ExponentPushToken[384]",
                        time,
                    },
                ];
            }
            fail("called with wrong time");
        }),
    };
    const expoMock: SenderParams[1] = {
        chunkNotifications: notifications => [notifications],
        sendNotifications: jest.fn(async notifications => {
            if (notifications[0].to === "ExponentPushToken[384]") {
                return [
                    {
                        type: "SuccessTicket" as const,
                        expoPushToken: notifications[0].to as string,
                        uuid: "my-uuid",
                        timestamp: "2021-08-27T17:40:34Z",
                        receiptId: "my-receipt-id",
                    },
                ];
            }
            fail("called with wrong expo push token");
        }),
        subsToMessages: (subs, message) => {
            if (subs[0].expoPushToken === "ExponentPushToken[384]") {
                return [
                    {
                        to: subs[0].expoPushToken,
                        sound: "default" as const,
                        title: message.text,
                        body: message.authorAndCountry,
                    },
                ];
            }
            fail("called with wrong expo push token");
        },
    };
    const awesomeMessage: SenderParams[2] = {
        getTodaysMessage: () =>
            Promise.resolve({
                text: "You are awesome!",
                authorAndCountry: "Phil from US",
            }),
    };
    const ticketRepo: SenderParams[3] = {
        putMany: jest.fn(() => Promise.resolve()),
    };
    const sender = new Sender(
        subsRepo,
        expoMock,
        awesomeMessage,
        ticketRepo,
        mockLogger
    );

    await sender.send("17:28");

    expect(expoMock.sendNotifications).toHaveBeenCalledWith([
        {
            to: "ExponentPushToken[384]",
            sound: "default",
            title: "You are awesome!",
            body: "Phil from US",
        },
    ]);
    expect(ticketRepo.putMany).toHaveBeenCalledWith([
        {
            type: "SuccessTicket",
            expoPushToken: "ExponentPushToken[384]",
            uuid: "my-uuid",
            timestamp: "2021-08-27T17:40:34Z",
            receiptId: "my-receipt-id",
        },
    ]);
});

it("does nothing if no subscriptions for given time in database", async () => {
    type SenderParams = ConstructorParameters<typeof Sender>;
    const subsRepo: SenderParams[0] = {
        getManyByTime: jest.fn(async () => []),
    };
    const expoMock: SenderParams[1] = {
        chunkNotifications: notifications => [notifications],
        sendNotifications: jest.fn(),
        subsToMessages: jest.fn(),
    };
    const awesomeMessage: SenderParams[2] = {
        getTodaysMessage: jest.fn(),
    };
    const ticketRepo: SenderParams[3] = {
        putMany: jest.fn(),
    };
    const sender = new Sender(
        subsRepo,
        expoMock,
        awesomeMessage,
        ticketRepo,
        mockLogger
    );

    await sender.send("17:28");

    expect(subsRepo.getManyByTime).toHaveBeenCalledWith("17:28");
    expect(expoMock.sendNotifications).not.toHaveBeenCalled();
    expect(ticketRepo.putMany).not.toHaveBeenCalled();
});

// TODO #535 follow-up. Implement. Currently fails.
// https://clevertap.com/blog/what-are-push-notification-character-limits/ TODO find better source
it("limits message size to about 65 chars for the title and 240 in the body if above that size", async () => {
    // https://docs.expo.dev/push-notifications/sending-notifications/#push-receipt-errors
    // MessageTooBig: the total notification payload was too large. On Android and iOS the total payload must be at most 4096 bytes.

    type SenderParams = ConstructorParameters<typeof Sender>;
    const subsRepo: SenderParams[0] = {
        getManyByTime: jest.fn().mockResolvedValueOnce([
            {
                expoPushToken: "ExponentPushToken[384]",
                time: "17:28",
            },
        ]),
    };
    const expoMock: SenderParams[1] = {
        chunkNotifications: notifications => [notifications],
        sendNotifications: jest.fn(async notifications => {
            return [
                {
                    type: "SuccessTicket" as const,
                    expoPushToken: notifications[0].to as string,
                    uuid: "my-uuid",
                    timestamp: "2021-08-27T17:40:34Z",
                    receiptId: "my-receipt-id",
                },
            ];
        }),
        subsToMessages: (subs, message) => [
            {
                to: "ExponentPushToken[384]",
                sound: "default" as const,
                title: message.text,
                body: message.authorAndCountry,
            },
        ],
    };
    // 1000 * 'asdf' * 1 byte = 4000 byte
    const veryLongMessage = range(1000)
        .map(() => "asdf")
        .join("");
    const awesomeMessage: SenderParams[2] = {
        getTodaysMessage: () =>
            Promise.resolve({
                text: veryLongMessage,
                authorAndCountry: "Phil from US",
            }),
    };
    const ticketRepo: SenderParams[3] = {
        putMany: jest.fn(),
    };
    const sender = new Sender(
        subsRepo,
        expoMock,
        awesomeMessage,
        ticketRepo,
        mockLogger
    );

    await sender.send("17:28");

    expect(expoMock.sendNotifications).toHaveBeenCalledWith([
        {
            to: "ExponentPushToken[384]",
            sound: "default",
            title: veryLongMessage.slice(0, 65),
            body: "TODO Phil from US",
        },
    ]);
});
