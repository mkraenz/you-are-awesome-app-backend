import { DeviceNotRegisteredHandler } from "../../src/push-notifications/DeviceNotRegisteredHandler";
import { mockLogger } from "../../src/util/ILogger";

it("deletes subs for notifications with DeviceNotRegistered errors", async () => {
    const subs = { deleteMany: jest.fn() };
    const tickets = {
        deleteMany: jest.fn(),
        getMany: jest.fn().mockResolvedValue([
            {
                type: "DeviceNotRegisteredReceipt",
                expoPushToken: "ExponentPushToken[123]",
                uuid: "my-uuid",
                timestamp: "2020-01-01T00:00:00.000Z",
                message:
                    '\\"ExponentPushToken[123]\\" is not a registered push notification recipient',
            },
        ]),
    };
    const deviceNotRegisteredHandler = new DeviceNotRegisteredHandler(
        tickets,
        subs,
        mockLogger
    );

    await deviceNotRegisteredHandler.unsubscribeAffectedExpoPushTokens();

    expect(subs.deleteMany).toHaveBeenCalledWith(["ExponentPushToken[123]"]);
    expect(tickets.getMany).toHaveBeenCalledWith("DeviceNotRegisteredReceipt");
    expect(tickets.deleteMany).toHaveBeenCalledWith(
        ["my-uuid"],
        "DeviceNotRegisteredReceipt"
    );
});

it("does nothing if no errors found", async () => {
    const subs = { deleteMany: jest.fn() };
    const tickets = {
        deleteMany: jest.fn(),
        getMany: jest.fn(async () => []),
    };
    const deviceNotRegisteredHandler = new DeviceNotRegisteredHandler(
        tickets,
        subs,
        mockLogger
    );

    await deviceNotRegisteredHandler.unsubscribeAffectedExpoPushTokens();

    expect(subs.deleteMany).not.toHaveBeenCalled();
    expect(tickets.getMany).toHaveBeenCalledWith("DeviceNotRegisteredReceipt");
    expect(tickets.deleteMany).not.toHaveBeenCalled();
});
