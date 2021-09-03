import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import {
    Ticket,
    TicketRepository,
} from "../../src/push-notifications/TicketRepository";
import { mockLogger } from "../../src/util/ILogger";
import { createTicketsTable, dropTable } from "../createTable.learning";

const TableName = "PushNotifsTicketRepoTickets";
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: "us-east-1",
    endpoint: "http://localhost:7999",
};
const dynamodb = new AWS.DynamoDB(serviceConfigOptions);
let docClient: AWS.DynamoDB.DocumentClient;

beforeEach(async () => {
    await createTicketsTable(dynamodb, TableName);
    docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);
});

afterEach(async () => {
    await dropTable(dynamodb, TableName);
});

it("puts a success ticket and can read it back", async () => {
    const querySpy = jest.spyOn(docClient, "query");
    const batchWriteSpy = jest.spyOn(docClient, "batchWrite");
    const tickets: Ticket[] = [
        {
            type: "SuccessTicket",
            expoPushToken: "ExponentPushToken[123]",
            uuid: "my-uuid",
            timestamp: "2021-08-27T20:18:12.000Z",
            receiptId: "my-receipt-id",
        },
    ];
    const repo = new TicketRepository(docClient, TableName, mockLogger);

    await repo.putMany(tickets);
    const ticketsFromDb = await repo.getSuccessTickets();

    expect(ticketsFromDb).toEqual(tickets);
    expect(batchWriteSpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledTimes(1);
});

it("does not return error tickets when getting success tickets", async () => {
    const tickets: Ticket[] = [
        {
            type: "DeviceNotRegisteredReceipt",
            expoPushToken: "ExponentPushToken[123]",
            uuid: "my-uuid",
            timestamp: "2021-08-27T20:18:12.000Z",
            message:
                '"\\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\\" is not a registered push notification recipient",',
        },
    ];
    const repo = new TicketRepository(docClient, TableName, mockLogger);

    await repo.putMany(tickets);
    const ticketsFromDb = await repo.getSuccessTickets();

    expect(ticketsFromDb).toEqual([]);
});

it("does nothing when deleting nonexisting tickets", async () => {
    const repo = new TicketRepository(docClient, TableName, mockLogger);

    await repo.deleteMany(
        ["asdf", "i dont exist", "where did all my chips go?"],
        "DeviceNotRegisteredReceipt"
    );
    const ticketsFromDb = await repo.getMany("DeviceNotRegisteredReceipt");

    expect(ticketsFromDb).toEqual([]);
});
