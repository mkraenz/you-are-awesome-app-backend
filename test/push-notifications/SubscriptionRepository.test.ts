import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";
import { range } from "lodash";
import { SubscriptionRepository } from "../../src/push-notifications/SubscriptionRepository";
import { MissingSetup } from "../../src/util/custom.error";
import { mockLogger } from "../../src/util/ILogger";
import {
    createGsiSubsByTime,
    createSubsTable,
    dropTable,
} from "../createTable.learning";

const TableName = "PushNotifsSubsRepoSubs";
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: "us-east-1",
    endpoint: "http://localhost:7999",
};
const dynamodb = new AWS.DynamoDB(serviceConfigOptions);
let docClient: AWS.DynamoDB.DocumentClient;

beforeEach(async () => {
    await createSubsTable(dynamodb, TableName);
    docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);
});

afterEach(async () => {
    await dropTable(dynamodb, TableName);
});

it("saves a subscription and reads it back", async () => {
    const putSpy = jest.spyOn(docClient, "put");
    const subs = new SubscriptionRepository(docClient, TableName);

    await subs.put("ExponentPushToken[123]", "04:07");
    const subs2 = await subs.get("ExponentPushToken[123]");

    expect(subs2).toEqual({
        expoPushToken: "ExponentPushToken[123]",
        time: "04:07",
    });
    expect(putSpy).toHaveBeenCalled();
});

it("saves a subscription and reads it back given time", async () => {
    const indexName = "SubsByTime";
    await createGsiSubsByTime(dynamodb, TableName, indexName);
    const querySpy = jest.spyOn(docClient, "query");
    const subs = new SubscriptionRepository(docClient, TableName, indexName);

    await subs.put("ExponentPushToken[123]", "04:07");
    const subs2 = await subs.getManyByTime("04:07");

    expect(subs2).toEqual([
        {
            expoPushToken: "ExponentPushToken[123]",
            time: "04:07",
        },
    ]);
    expect(querySpy).toHaveBeenCalled();
});

it("falls back to [] if no subscriptions found for given time", async () => {
    const indexName = "SubsByTime";
    await createGsiSubsByTime(dynamodb, TableName, indexName);
    const subs = new SubscriptionRepository(docClient, TableName, indexName);

    const subs2 = await subs.getManyByTime("04:07");

    expect(subs2).toEqual([]);
});

it("rejects to get all given time if index name not provided at setup", () => {
    const subs = new SubscriptionRepository(docClient, TableName);
    expect(() => subs.getManyByTime("01:23")).rejects.toThrow(MissingSetup);
});

it("saves a subscription and deletes it", async () => {
    const subs = new SubscriptionRepository(docClient, TableName);
    await subs.put("ExponentPushToken[123]", "04:07");
    const subs2 = await subs.get("ExponentPushToken[123]");
    expect(subs2).toEqual({
        expoPushToken: "ExponentPushToken[123]",
        time: "04:07",
    });

    await subs.delete("ExponentPushToken[123]");

    expect(() => subs.get("ExponentPushToken[123]")).rejects.toThrow(
        /No subscription found/
    );
});

it("rejects when bulk deleting more than 25 items in a single call", () => {
    const tokens = range(0, 26).map(i => `ExponentPushToken[${i}]`);
    const subs = new SubscriptionRepository(docClient, TableName);

    expect(() => subs.deleteMany(tokens)).rejects.toThrow(
        /Can only delete <=25 items at a time/
    );
});

it("deletes many subscriptions", async () => {
    const tokens = range(0, 25).map(i => `ExponentPushToken[${i}]`);
    const indexName = "SubsByTime";
    await createGsiSubsByTime(dynamodb, TableName, indexName);
    const subs = new SubscriptionRepository(
        docClient,
        TableName,
        indexName,
        mockLogger
    );
    const putPromises = tokens.map(t => subs.put(t, "04:07"));
    await Promise.all(putPromises);
    const savedSubs = await subs.getManyByTime("04:07");
    expect(savedSubs).toHaveLength(25);

    await subs.deleteMany(tokens);

    const savedSubsAfterDelete = await subs.getManyByTime("04:07");
    expect(savedSubsAfterDelete).toEqual([]);
});
