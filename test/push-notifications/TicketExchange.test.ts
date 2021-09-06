import MockDate from "mockdate";
import { TicketExchange } from "../../src/push-notifications/TicketExchange";
import { mockLogger } from "../../src/util/ILogger";
import { expectExtension } from "../util";

afterEach(() => {
    MockDate.reset();
});
type Params = ConstructorParameters<typeof TicketExchange>;
type TicketService = Params[0];
type ExpoService = Params[1];

it("does nothing if no messages found", async () => {
    const tickets: TicketService = {
        deleteMany: jest.fn(),
        putMany: jest.fn(),
        getSuccessTickets: jest.fn(async () => []),
    };
    const expo: ExpoService = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [],
            errorReceipts: [],
        })),
    };
    const handler = new TicketExchange(tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 0 });
    expect(tickets.deleteMany).not.toHaveBeenCalled();
});

it("ignores messages less than 30 mins old (to give expo + firebase cloud messaging time to send notifications)", async () => {
    MockDate.set("2021-01-01T00:29:18Z");
    const tickets: TicketService = {
        deleteMany: jest.fn(),
        putMany: jest.fn(),
        getSuccessTickets: jest.fn(async () => [
            {
                type: "SuccessTicket" as const,
                uuid: "my-uuid-1",
                timestamp: "2021-01-01T00:01:18Z",
                receiptId: "my-receipt-1",
                expoPushToken: "ExponentPushToken[123]",
            },
        ]),
    };
    const expo: ExpoService = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [],
            errorReceipts: [],
        })),
    };
    const handler = new TicketExchange(tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 0 });
});

it("deletes success tickets with success receipts", async () => {
    MockDate.set("2021-01-01T00:32:18Z");
    const tickets: TicketService = {
        deleteMany: jest.fn(),
        putMany: jest.fn(),
        getSuccessTickets: jest.fn(async () => [
            {
                type: "SuccessTicket" as const,
                uuid: "my-uuid-1",
                timestamp: "2021-01-01T00:01:18Z",
                receiptId: "my-receipt-1",
                expoPushToken: "ExponentPushToken[123]",
            },
        ]),
    };
    const expo: ExpoService = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [
                {
                    type: "SuccessReceipt" as const,
                    ticketUuid: "my-uuid-1",
                    receiptId: "my-receipt-1",
                },
            ],
            errorReceipts: [],
        })),
    };
    const handler = new TicketExchange(tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 1 });
    expect(tickets.deleteMany).toHaveBeenCalledWith(
        ["my-uuid-1"],
        "SuccessTicket"
    );
});

it("replaces success tickets by error receipts", async () => {
    MockDate.set("2021-01-01T00:32:18Z");
    const tickets: TicketService = {
        deleteMany: jest.fn(),
        putMany: jest.fn(),
        getSuccessTickets: jest.fn(async () => [
            {
                type: "SuccessTicket" as const,
                uuid: "my-uuid-1",
                timestamp: "2021-01-01T00:01:18Z",
                receiptId: "my-receipt-1",
                expoPushToken: "ExponentPushToken[123]",
            },
        ]),
    };
    const expo: ExpoService = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [],
            errorReceipts: [
                {
                    type: "ErrorReceipt" as const,
                    ticketUuid: "my-uuid-1",
                    receiptId: "my-receipt-1",
                    expoPushToken: "ExponentPushToken[123]",
                    status: "error" as const,
                    message:
                        '\\"ExponentPushToken[123]\\" is not a registered push notification recipient',
                    details: { error: "DeviceNotRegistered" as const },
                },
            ],
        })),
    };
    const handler = new TicketExchange(tickets, expo, mockLogger);
    MockDate.set("2021-01-01T00:33:19.000Z"); // let time pass

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 1 });
    expect(tickets.deleteMany).toHaveBeenCalledWith(
        ["my-uuid-1"],
        "SuccessTicket"
    );
    expect(tickets.putMany).toHaveBeenCalledWith([
        {
            type: "DeviceNotRegisteredReceipt",
            expoPushToken: "ExponentPushToken[123]",
            uuid: expectExtension.uuidV4,
            timestamp: "2021-01-01T00:33:19.000Z", // TODO #535 which time should this be? original ticket, or save time
            message:
                '\\"ExponentPushToken[123]\\" is not a registered push notification recipient',
            receiptId: "my-receipt-1",
        },
    ]);
});
