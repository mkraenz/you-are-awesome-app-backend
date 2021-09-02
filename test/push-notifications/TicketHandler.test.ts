import MockDate from "mockdate";
import { TicketHandler } from "../../src/push-notifications/TIcketHandler";
import { mockLogger } from "../../src/util/ILogger";

afterEach(() => {
    MockDate.reset();
});

it("does nothing if no messages found", async () => {
    type Params = ConstructorParameters<typeof TicketHandler>;
    const subs: Params[0] = { deleteMany: jest.fn() };
    const tickets: Params[1] = {
        deleteManySuccessTickets: jest.fn(),
        getSuccessTickets: jest.fn(async () => []),
    };
    const expo: Params[2] = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [],
            errorReceipts: [],
        })),
    };
    const handler = new TicketHandler(subs, tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 0 });
    expect(subs.deleteMany).not.toHaveBeenCalled();
    expect(tickets.deleteManySuccessTickets).not.toHaveBeenCalled();
});

it("ignores messages less than 30 mins old (to give expo + firebase cloud messaging time to send notifications)", async () => {
    MockDate.set("2021-01-01T00:29:18Z");
    type Params = ConstructorParameters<typeof TicketHandler>;
    const subs: Params[0] = { deleteMany: jest.fn() };
    const tickets: Params[1] = {
        deleteManySuccessTickets: jest.fn(),
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
    const expo: Params[2] = {
        chunkSuccessTickets: tickets => [tickets],
        getReceipts: jest.fn(async () => ({
            successReceipts: [],
            errorReceipts: [],
        })),
    };
    const handler = new TicketHandler(subs, tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 0 });
});

it("deletes success tickets with success receipts", async () => {
    MockDate.set("2021-01-01T00:32:18Z");
    type Params = ConstructorParameters<typeof TicketHandler>;
    const subs: Params[0] = { deleteMany: jest.fn() };
    const tickets: Params[1] = {
        deleteManySuccessTickets: jest.fn(),
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
    const expo: Params[2] = {
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
    const handler = new TicketHandler(subs, tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 1 });
    expect(tickets.deleteManySuccessTickets).toHaveBeenCalledWith([
        "my-uuid-1",
    ]);
    expect(subs.deleteMany).not.toHaveBeenCalled();
});

it("unsubscribes from notifications on DeviceNotRegistered receipts and deletes the success ticket", async () => {
    MockDate.set("2021-01-01T00:32:18Z");
    type Params = ConstructorParameters<typeof TicketHandler>;
    const subs: Params[0] = { deleteMany: jest.fn() };
    const tickets: Params[1] = {
        deleteManySuccessTickets: jest.fn(),
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
    const expo: Params[2] = {
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
                        '\\"ExponentPushToken[123456]\\" is not a registered push notification recipient',
                    details: { error: "DeviceNotRegistered" as const },
                },
            ],
        })),
    };
    const handler = new TicketHandler(subs, tickets, expo, mockLogger);

    const res = await handler.handleSuccessTickets();

    expect(res).toEqual({ ticketsProcessed: 1 });
    expect(tickets.deleteManySuccessTickets).toHaveBeenCalledWith([
        "my-uuid-1",
    ]);
    expect(subs.deleteMany).toHaveBeenCalledWith(["ExponentPushToken[123]"]);
});

it("saves other error receipts to tickets db and deletes the success ticket", async () => {
    fail("TODO implement");
});
